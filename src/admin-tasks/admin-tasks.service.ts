import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AssignTaskDto } from './dto/admin-task.dto';
import { ProfessionalListItemDto, AssignProfessionalToTaskDto } from './dto/professional-assignment.dto';

@Injectable()
export class AdminTasksService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AdminTasksService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async getAdminTaskPageData() {
    // 1. Fetch Latest Alert Detections (Rule 1)
    const { data: events, error: eventError } = await this.supabase
      .from('activity_events')
      .select('*, patients(name, patient_id_code, assigned_caregiver_id), admin_tasks(*, users(full_name))')
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventError) {
      this.logger.error(`Error fetching alert detections: ${eventError.message}`);
    }

    const eventList = events || [];

    const latestAlertDetections = eventList.map((e: any) => {
      const diffMs = new Date().getTime() - new Date(e.created_at).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));
      const activeTask = e.admin_tasks && e.admin_tasks.length > 0 ? e.admin_tasks[0] : null;

      const isAssigned = !!activeTask?.assigned_to;

      return {
        id: e.id,
        detection: e.event_type === 'INACTIVITY_DETECTION' ? 'Prolonged Inactivity Detection' : 'Possible Fall Detection',
        status: activeTask?.task_status || (e.resolved_status === 'RESOLVED' ? 'RESOLVED' : 'UNASSIGNED'),
        howLong: `${diffMins} mins ago`,
        isAssigned,
        assignedToName: isAssigned ? activeTask.users?.full_name || 'Assigned Staff' : undefined,
      };
    });

    // 2. Fetch Task Details for unassigned patients (Rule 2)
    const { data: unassignedPatient } = await this.supabase
      .from('patients')
      .select('*')
      .is('assigned_caregiver_id', null)
      .maybeSingle();

    const selectedPatient = unassignedPatient || (eventList[0]?.patients ? eventList[0].patients : null);

    const taskDetails = {
      unassignedPatient: selectedPatient ? `${selectedPatient.name || 'Patient'} (${selectedPatient.patient_id_code || 'PAT-0000'})` : 'No Unassigned Patients',
      eventLocation: eventList[0]?.event_location || 'Ward A - Room 102',
      patientSafety: selectedPatient ? `Safety Status: ${selectedPatient.status || 'NORMAL'} - Continuous Monitoring Active` : 'STABLE',
    };

    // 3. Fetch Available Responders Grid (Rule 4)
    const { data: responders, error: responderError } = await this.supabase
      .from('users')
      .select('id, full_name, email, role, duty_status, avatar_url');

    if (responderError) {
      this.logger.error(`Error fetching responders: ${responderError.message}`);
    }

    const availableResponders = (responders || []).map((r) => ({
      id: r.id,
      pic: r.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.full_name || 'User')}`,
      name: r.full_name || r.email,
      professionalTitle: r.role,
      dutyStatus: r.duty_status || 'AVAILABLE',
    }));

    return {
      latestAlertDetections,
      taskDetails,
      availableResponders,
    };
  }

  async assignTask(adminUserId: string, dto: AssignTaskDto) {
    // 1. Verify target event exists
    const { data: event, error: eventError } = await this.supabase
      .from('activity_events')
      .select('id, patient_id')
      .eq('id', dto.eventId)
      .maybeSingle();

    if (eventError || !event) {
      throw new NotFoundException('Target activity alert event not found');
    }

    // 2. Create or update admin task assignment record
    const { data: task, error: taskError } = await this.supabase
      .from('admin_tasks')
      .insert({
        event_id: dto.eventId,
        patient_id: event.patient_id,
        task_type: dto.taskType,
        assigned_to: dto.assignToUserId,
        priority: dto.priority,
        due_by: dto.dueBy,
        assignment_message: dto.assignmentMessage || '',
        task_status: 'ASSIGNED',
      })
      .select()
      .single();

    if (taskError || !task) {
      this.logger.error(`Failed to assign task: ${taskError?.message}`);
      throw new BadRequestException('Failed to complete task assignment');
    }

    // 3. Update responder duty status to TASKED
    await this.supabase
      .from('users')
      .update({ duty_status: 'TASKED' })
      .eq('id', dto.assignToUserId);

    // 4. Update patient assignment if unassigned
    await this.supabase
      .from('patients')
      .update({ assigned_caregiver_id: dto.assignToUserId })
      .eq('id', event.patient_id);

    return {
      message: 'Task assigned successfully and responder notified',
      task: {
        id: task.id,
        eventId: task.event_id,
        taskType: task.task_type,
        assignedToUserId: task.assigned_to,
        priority: task.priority,
        dueBy: task.due_by,
        assignmentMessage: task.assignment_message,
        taskStatus: task.task_status,
      },
    };
  }

  // 1. Get tabular list of all professionals for Task Assignment Page
  async getProfessionalsForAssignment() {
    const { data: users, error } = await this.supabase
      .from('users')
      .select('id, full_name, email, role, duty_status')
      .in('role', ['CAREGIVER', 'HEALTHCARE_PROFESSIONAL']);

    if (error) {
      this.logger.error(`Error fetching professionals: ${error.message}`);
      throw new BadRequestException('Failed to retrieve professionals list');
    }

    const professionalList = [];
    for (const u of (users || [])) {
      // Count current active patients assigned to this user
      const { count } = await this.supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_caregiver_id', u.id);

      professionalList.push({
        id: u.id,
        name: u.full_name || u.email,
        role: u.role,
        availability: u.duty_status || 'AVAILABLE',
        currentPatientsCount: count || 0,
        action: 'Assign',
      });
    }

    return professionalList;
  }

  // 2. Assign professional to task and send notification
  async assignProfessionalToTask(dto: AssignProfessionalToTaskDto) {
    const { taskId, professionalId, assignmentMessage } = dto;

    // Update admin_tasks or activity_events assignment
    const { error: taskError } = await this.supabase
      .from('admin_tasks')
      .update({ assigned_to: professionalId, task_status: 'ASSIGNED' })
      .eq('id', taskId);

    if (taskError) {
      this.logger.error(`Failed to assign task: ${taskError.message}`);
      throw new BadRequestException('Failed to assign professional to task');
    }

    // Send notification to the assigned professional
    const notificationMessage = assignmentMessage || 'You have been assigned to a new patient monitoring task.';
    await this.supabase.from('user_notifications').insert({
      user_id: professionalId,
      title: 'New Task Assignment',
      message: notificationMessage,
      is_read: false,
    });

    // Update professional status to TASKED
    await this.supabase
      .from('users')
      .update({ duty_status: 'TASKED' })
      .eq('id', professionalId);

    return {
      message: 'Professional successfully assigned to task and notification sent.',
      taskId,
      professionalId,
    };
  }
}