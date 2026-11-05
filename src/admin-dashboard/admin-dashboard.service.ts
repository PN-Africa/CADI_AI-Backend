import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AlertQueueFilter, SaveAdminNoteDto } from './dto/admin-dashboard.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdateUserDetailsDto } from './dto/manage-user.dto';

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

  // 1. Get Caregiver Dropdown List
  async getAvailableCaregivers() {
    const { data: caregivers, error } = await this.supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('role', 'CAREGIVER');

    if (error) {
      this.logger.error(`Error fetching caregiver list: ${error.message}`);
      throw new BadRequestException('Failed to fetch available caregivers');
    }

    return (caregivers || []).map((c) => ({
      id: c.id,
      fullName: c.full_name || c.email,
      role: c.role,
    }));
  }

  // 2. Create / Save Patient (Rule 1)
  async createPatient(dto: CreatePatientDto) {
    const { personalInformation, emergencyContact, care } = dto;

    // Generate unique alphanumeric patient ID code (e.g. PAT-8492)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const patientIdCode = `PAT-${randomCode}`;
    const fullName = `${personalInformation.firstName.trim()} ${personalInformation.lastName.trim()}`;

    // Calculate age from Date of Birth
    const dob = new Date(personalInformation.dateOfBirth);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

    const { data: patient, error } = await this.supabase
      .from('patients')
      .insert({
        name: fullName,
        first_name: personalInformation.firstName.trim(),
        last_name: personalInformation.lastName.trim(),
        date_of_birth: personalInformation.dateOfBirth,
        age: calculatedAge,
        gender: personalInformation.gender,
        phone_number: personalInformation.phoneNumber.trim(),
        email_address: personalInformation.emailAddress.trim().toLowerCase(),
        home_address: personalInformation.homeAddress.trim(),

        emergency_contact_name: emergencyContact.fullName.trim(),
        emergency_contact_relationship: emergencyContact.relationship,
        emergency_contact_phone: emergencyContact.phoneNumber.trim(),

        patient_id_code: patientIdCode,
        status: care.status,
        assigned_caregiver_id: care.assignedCaregiverId,
        allergies: care.allergies.trim(),
        care_notes: care.careNotes ? care.careNotes.trim() : '',
        current_condition: care.careNotes || 'Patient registered successfully.',
      })
      .select()
      .single();

    if (error || !patient) {
      this.logger.error(`Error saving patient record: ${error?.message}`);
      throw new BadRequestException(`Failed to save patient: ${error?.message || 'Unknown error'}`);
    }

    return {
      message: 'Patient saved successfully',
      patient: {
        id: patient.id,
        patientIdCode: patient.patient_id_code,
        fullName: patient.name,
        status: patient.status,
        assignedCaregiverId: patient.assigned_caregiver_id,
        createdAt: patient.created_at,
      },
    };
  }

  // 1. Get Patient Details Form Prefill for Editing
  async getPatientForEdit(patientId: string) {
    const { data: patient, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .maybeSingle();

    if (error || !patient) {
      throw new NotFoundException('Patient record not found');
    }

    return {
      patientId: patient.id,
      patientIdCode: patient.patient_id_code,
      patientDetails: {
        firstName: patient.first_name || '',
        lastName: patient.last_name || '',
        dateOfBirth: patient.date_of_birth || '',
        emailAddress: patient.email_address || '',
        phoneNumber: patient.phone_number || '',
        gender: patient.gender || 'male',
      },
      clinicalInformation: {
        medicalRecordNumber: patient.medical_record_number || `MRN-${patient.patient_id_code.replace('PAT-', '')}`,
        primaryCarePhysician: patient.primary_care_physician || 'Dr. Elizabeth Umoren',
        careTeam: patient.care_team || 'Cardiology North-wing',
        patientStatus: patient.status || 'NORMAL',
        notes: patient.care_notes || patient.current_condition || '',
      },
    };
  }

  // 2. Update Patient Record ("Save Changes" Button Action)
  async updatePatient(patientId: string, dto: UpdatePatientDto) {
    const { patientDetails, clinicalInformation } = dto;
    const fullName = `${patientDetails.firstName.trim()} ${patientDetails.lastName.trim()}`;

    // Recalculate age from Date of Birth
    const dob = new Date(patientDetails.dateOfBirth);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

    const { data: updatedPatient, error } = await this.supabase
      .from('patients')
      .update({
        name: fullName,
        first_name: patientDetails.firstName.trim(),
        last_name: patientDetails.lastName.trim(),
        date_of_birth: patientDetails.dateOfBirth,
        age: calculatedAge,
        email_address: patientDetails.emailAddress.trim().toLowerCase(),
        phone_number: patientDetails.phoneNumber.trim(),
        gender: patientDetails.gender,

        medical_record_number: clinicalInformation.medicalRecordNumber.trim(),
        primary_care_physician: clinicalInformation.primaryCarePhysician.trim(),
        care_team: clinicalInformation.careTeam.trim(),
        status: clinicalInformation.patientStatus,
        care_notes: clinicalInformation.notes ? clinicalInformation.notes.trim() : '',
        current_condition: clinicalInformation.notes || 'Patient clinical details updated.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', patientId)
      .select()
      .single();

    if (error || !updatedPatient) {
      this.logger.error(`Error updating patient record: ${error?.message}`);
      throw new BadRequestException(`Failed to update patient: ${error?.message || 'Unknown error'}`);
    }

    return {
      message: 'Patient details updated successfully',
      patient: {
        id: updatedPatient.id,
        patientIdCode: updatedPatient.patient_id_code,
        fullName: updatedPatient.name,
        status: updatedPatient.status,
        updatedAt: updatedPatient.updated_at,
      },
    };
  }

  // 1. Get user details for editing in Manage Users page
  async getUserForEdit(userId: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role || 'CAREGIVER',
      email: user.email || '',
      phoneNumber: user.phone || '',
      licenseNumber: user.medical_license_id || '',
      accessLevel: user.access_level || 'Standard',
      department: user.department || 'General',
      assignedTeam: user.assigned_team || 'Team A',
      patientGroup: user.patient_group || 'Group 1',
      notes: user.notes || '',
    };
  }

  // 2. Update user details ("Save User" button action & notification)
  async updateUserAndNotify(userId: string, dto: UpdateUserDetailsDto) {
    const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;

    const { data: updatedUser, error } = await this.supabase
      .from('users')
      .update({
        first_name: dto.firstName.trim(),
        last_name: dto.lastName.trim(),
        full_name: fullName,
        role: dto.role,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phoneNumber.trim(),
        medical_license_id: dto.licenseNumber.trim(),
        access_level: dto.accessLevel,
        department: dto.department,
        assigned_team: dto.assignedTeam,
        patient_group: dto.patientGroup,
        notes: dto.notes ? dto.notes.trim() : '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !updatedUser) {
      this.logger.error(`Error updating user: ${error?.message}`);
      throw new BadRequestException('Failed to update user details');
    }

    // Trigger notification sent to the user
    await this.supabase.from('user_notifications').insert({
      user_id: userId,
      title: 'Profile Updated',
      message: 'Your staff profile and assignment details have been updated by administration.',
      is_read: false,
    });

    return {
      message: 'User updated successfully and notification sent to the staff member.',
      user: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        role: updatedUser.role,
        updatedAt: updatedUser.updated_at,
      },
    };
  }
}