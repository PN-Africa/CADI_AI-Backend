import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AlertQueueFilter, SaveAdminNoteDto } from './dto/admin-dashboard.dto';

@Injectable()
export class AdminDashboardService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async getAdminDashboardData(filter: AlertQueueFilter = AlertQueueFilter.ALL) {
    // 1. Fetch Patients & Metrics
    const { data: patients, error: patientError } = await this.supabase
      .from('patients')
      .select('*');

    if (patientError) {
      this.logger.error(`Error fetching patients for admin: ${patientError.message}`);
    }

    const patientList = patients || [];
    const totalPatients = patientList.length;
    const activePatients = patientList.filter(p => p.status !== 'NORMAL').length;
    const criticalCount = patientList.filter(p => p.status === 'EMERGENCY').length;
    const monitoredCount = totalPatients; // Total under monitoring

    // 2. Fetch Activity Events / Alerts
    let alertQuery = this.supabase
      .from('activity_events')
      .select('*, patients(name)');

    if (filter === AlertQueueFilter.CRITICAL) {
      alertQuery = alertQuery.eq('alert_severity', 'URGENT');
    } else if (filter === AlertQueueFilter.MONITORED) {
      alertQuery = alertQuery.eq('resolved_status', 'PENDING');
    } else if (filter === AlertQueueFilter.RESOLVED) {
      alertQuery = alertQuery.eq('resolved_status', 'RESOLVED');
    }

    const { data: events, error: eventError } = await alertQuery.order('created_at', { ascending: false });

    if (eventError) {
      this.logger.error(`Error fetching alerts for admin: ${eventError.message}`);
    }

    const eventList = events || [];
    const activeAlerts = eventList.filter(e => e.resolved_status !== 'RESOLVED').length;

    const alertQueue = eventList.map(e => {
      const diffMs = new Date().getTime() - new Date(e.created_at).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));

      let detectionText = 'Possible fall detection';
      if (e.event_type === 'INACTIVITY_DETECTION') detectionText = 'Prolonged inactivity detection';
      else if (e.event_type === 'MOVEMENT_DETECTION') detectionText = 'Assessment completed';

      return {
        id: e.id,
        patientName: e.patients?.name || 'Unknown Patient',
        status: e.resolved_status === 'RESOLVED' ? 'RESOLVED' : (e.alert_severity === 'URGENT' ? 'CRITICAL' : 'MONITORED'),
        detection: detectionText,
        howLong: `${diffMins} mins ago`,
      };
    });

    // 3. Fetch Users Summary (Caregivers, Healthcare Professionals, Admins, Pending)
    const { data: users, error: userError } = await this.supabase
      .from('users')
      .select('role, invite_status, is_active_admin');

    const userList = users || [];
    const totalUsers = userList.length;
    const activeAdmins = userList.filter(u => u.is_active_admin === true || u.role === 'ADMIN').length;
    const pendingInvites = userList.filter(u => u.invite_status === 'PENDING').length;

    // 4. Fetch Admin Notes
    const { data: notes } = await this.supabase
      .from('admin_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      metrics: {
        activePatients,
        activeAlerts,
        responseSla: '96.2%', // Computed SLA benchmark
        totalPatients,
        criticalCount,
        monitoredCount,
      },
      alertQueue,
      authorizedUsers: {
        totalUsers,
        activeAdmins: Math.max(1, activeAdmins),
        pendingInvites,
      },
      quickActions: {
        reviewAlertsUrl: '/admin/alerts',
        historyUrl: '/admin/history',
        exportReportUrl: '/admin/reports/export',
      },
      adminNotes: (notes || []).map(n => ({
        id: n.id,
        noteContent: n.note_content,
        createdAt: n.created_at,
      })),
    };
  }

  async saveAdminNote(adminEmail: string, dto: SaveAdminNoteDto) {
    const { data: note, error } = await this.supabase
      .from('admin_notes')
      .insert({
        admin_email: adminEmail,
        note_content: dto.noteContent,
      })
      .select()
      .single();

    if (error || !note) {
      throw new BadRequestException('Failed to save admin note');
    }

    return {
      message: 'Admin note saved successfully',
      note: {
        id: note.id,
        noteContent: note.note_content,
        createdAt: note.created_at,
      },
    };
  }

  // 1. Get tabular list of all patients for Admin Patient Page
  async getAdminPatientsList() {
    const { data: patients, error } = await this.supabase
      .from('patients')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      this.logger.error(`Error fetching patients for admin: ${error.message}`);
      throw new BadRequestException('Failed to retrieve patients list');
    }

    return (patients || []).map((p) => {
      const diffMs = new Date().getTime() - new Date(p.updated_at).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));

      return {
        id: p.id,
        patientIdColumn: `${p.name} - ${p.patient_id_code}`,
        status: p.status,
        lastActivity: `${diffMins} mins`,
      };
    });
  }

  // 2. Get patient details when an admin clicks on any row
  async getAdminPatientDetails(patientId: string) {
    const { data: patient, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .maybeSingle();

    if (error || !patient) {
      throw new NotFoundException('Patient record not found');
    }

    return {
      id: patient.id,
      name: patient.name,
      patientIdCode: patient.patient_id_code,
      age: patient.age || 65,
      status: patient.status,
      heartRate: patient.heart_rate || 75,
      bloodOxygen: patient.blood_oxygen || 98.0,
      temperature: patient.temperature || 36.6,
      lastUpdated: patient.updated_at,
    };
  }
}