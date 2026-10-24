import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
    ActivityFilter,
    HistoryDayFilter,
    ResolveEventDto,
    HistoryStatusFilter,
} from './dto/patient.dto';

@Injectable()
export class PatientsService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(PatientsService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async getPatientsList(userId: string, role: string) {
    let query = this.supabase.from('patients').select('*');
    if (role === 'CAREGIVER') {
      query = query.eq('assigned_caregiver_id', userId);
    }

    const { data: patients, error } = await query;
    if (error) {
      this.logger.error(`Error fetching patients list: ${error.message}`);
      throw new Error('Failed to retrieve patients');
    }

    return (patients || []).map((p) => {
      // Calculate minutes since last updated/attended
      const diffMs = new Date().getTime() - new Date(p.updated_at).getTime();
      const diffMins = Math.floor(diffMs / 60000);

      return {
        id: p.id,
        patientDisplay: `${p.name} - ${p.patient_id_code}`,
        status: p.status,
        lastActivity: `${diffMins <= 0 ? 1 : diffMins} mins ago`,
      };
    });
  }

  async getPatientDetails(patientId: string) {
    const { data: patient, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .maybeSingle();

    if (error || !patient) {
      throw new NotFoundException('Patient not found');
    }

    return {
      id: patient.id,
      name: patient.name,
      patientIdCode: patient.patient_id_code,
      age: patient.age || 65,
      status: patient.status,
      lastUpdated: patient.updated_at,
      heartRate: patient.heart_rate || 75,
      bloodOxygen: patient.blood_oxygen || 98.0,
      temperature: patient.temperature || 36.6,
      movementKm: patient.movement_km || 1.2,
      minsSinceEvents: {
        inactivityDetectedMins: patient.mins_since_inactivity || 15,
        highTemperatureMins: patient.mins_since_high_temp || 120,
        suddenMovementMins: patient.mins_since_sudden_movement || 45,
        normalMovementMins: patient.mins_since_normal_movement || 5,
        positionChangeMins: patient.mins_since_position_change || 30,
      },
    };
  }

  async getPatientMonitoring(patientId: string) {
    const { data: patient, error } = await this.supabase
      .from('patients')
      .select('status, movement_km')
      .eq('id', patientId)
      .maybeSingle();

    if (error || !patient) {
      throw new NotFoundException('Patient not found');
    }

    // Fetch historical readings for charts (or return mock data series points if empty)
    const { data: readings } = await this.supabase
      .from('monitoring_readings')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: true })
      .limit(10);

    const chartPoints = (readings && readings.length > 0)
      ? readings.map((r) => ({
          timestamp: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          heartRate: r.heart_rate,
          bloodOxygen: r.blood_oxygen,
          temperature: r.temperature,
        }))
      : [
          { timestamp: '10:00', heartRate: 72, bloodOxygen: 98, temperature: 36.5 },
          { timestamp: '10:15', heartRate: 75, bloodOxygen: 97.5, temperature: 36.6 },
          { timestamp: '10:30', heartRate: 88, bloodOxygen: 96.0, temperature: 36.8 },
          { timestamp: '10:45', heartRate: 80, bloodOxygen: 98.0, temperature: 36.6 },
        ];

    return {
      charts: chartPoints,
      movementCalculation: `${patient.movement_km || 1.2} km today`,
      status: patient.status,
    };
  }

  async getPatientActivity(patientId: string, filter: ActivityFilter = ActivityFilter.TODAY) {
    let timeLimit = new Date();
    if (filter === ActivityFilter.TODAY || filter === ActivityFilter.HOURS_24) {
      timeLimit.setHours(timeLimit.getHours() - 24);
    } else if (filter === ActivityFilter.DAYS_7) {
      timeLimit.setDate(timeLimit.getDate() - 7);
    }

    const { data: events, error } = await this.supabase
      .from('activity_events')
      .select('*')
      .eq('patient_id', patientId)
      .gte('created_at', timeLimit.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Error fetching activity events: ${error.message}`);
    }

    const eventList = events || [];
    if (eventList.length === 0) {
      // Fallback mock logs if no events are seeded yet
      return [
        { eventType: 'INACTIVITY_DETECTION', description: 'Prolonged inactivity detected', timestamp: new Date().toISOString() },
        { eventType: 'MOVEMENT_DETECTION', description: 'Normal movement pattern resumed', timestamp: new Date(Date.now() - 3600000).toISOString() },
      ];
    }

    return eventList.map((e) => ({
      eventType: e.event_type,
      description: e.description,
      timestamp: e.created_at,
    }));
  }

  // 1. Get Activity Timeline List
  async getPatientActivityTimeline(patientId: string) {
    const { data: events, error } = await this.supabase
      .from('activity_events')
      .select('id, event_type, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Error fetching activity timeline: ${error.message}`);
    }

    return (events || []).map((e) => ({
      id: e.id,
      detection: e.event_type === 'INACTIVITY_DETECTION' ? 'Inactivity detected' : 'Movement detected',
      time: e.created_at,
    }));
  }

  // 2. Get Single Event Details
  async getEventDetails(eventId: string) {
    const { data: event, error } = await this.supabase
      .from('activity_events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (error || !event) {
      throw new NotFoundException('Activity event not found');
    }

    const recordedDate = new Date(event.created_at);
    const formattedDate = recordedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
      ' - ' + recordedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: event.id,
      detectionName: event.event_type === 'INACTIVITY_DETECTION' ? 'Inactivity detected' : 'Movement detected',
      time: event.created_at,
      eventOverview: {
        recordedAt: formattedDate,
        inactivityDuration: event.duration || '45 mins',
        source: event.source || 'Activity Timeline',
      },
      caregiverNotes: event.caregiver_notes || null,
      resolvedStatus: event.resolved_status || 'PENDING',
    };
  }

  // 3. Add Caregiver Note (Restricted to Caregiver role in controller)
  async addCaregiverNote(eventId: string, userId: string, note: string) {
    const { error } = await this.supabase
      .from('activity_events')
      .update({ caregiver_notes: note })
      .eq('id', eventId);

    if (error) {
      throw new BadRequestException('Failed to add caregiver note');
    }

    // Log to history audit trail
    await this.supabase.from('event_history').insert({
      event_id: eventId,
      action_type: 'NOTE_ADDED',
      details: `Caregiver added observation note: ${note}`,
      performed_by: userId,
    });

    return { message: 'Caregiver note recorded successfully' };
  }

  // 4. Resolve Details / Save Draft (Restricted to Healthcare Professional in controller)
  async resolveEvent(eventId: string, userId: string, dto: ResolveEventDto) {
    const { data: event, error: findError } = await this.supabase
      .from('activity_events')
      .select('*, patients(id, status)')
      .eq('id', eventId)
      .maybeSingle();

    if (findError || !event) {
      throw new NotFoundException('Event not found');
    }

    const statusToSet = dto.isDraft ? 'DRAFT' : 'RESOLVED';

    // Update activity event record
    const { error: updateError } = await this.supabase
      .from('activity_events')
      .update({
        resolution_reason: dto.resolutionReason,
        resolution_notes: dto.resolutionNotes,
        resolved_status: statusToSet,
        resolved_at: dto.isDraft ? null : new Date().toISOString(),
        resolved_by: userId,
      })
      .eq('id', eventId);

    if (updateError) {
      throw new BadRequestException('Failed to update event resolution');
    }

    // If fully resolved, update patient status in database and history
    if (!dto.isDraft) {
      await this.supabase
        .from('patients')
        .update({ status: dto.updatedPatientStatus, updated_at: new Date().toISOString() })
        .eq('id', event.patient_id);
    }

    // Log to history audit trail
    await this.supabase.from('event_history').insert({
      event_id: eventId,
      patient_id: event.patient_id,
      action_type: dto.isDraft ? 'SAVED_AS_DRAFT' : 'RESOLVED',
      details: dto.isDraft ? 'Event saved as draft' : `Event resolved with status set to ${dto.updatedPatientStatus}`,
      performed_by: userId,
    });

    const recordedDate = new Date(event.created_at);
    const formattedDate = recordedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
      ' - ' + recordedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      message: dto.isDraft ? 'Resolution saved as draft successfully.' : 'Event resolved successfully and patient status updated.',
      eventSummaries: {
        detection: event.event_type === 'INACTIVITY_DETECTION' ? 'Inactivity detected' : 'Movement detected',
        recordedAt: formattedDate,
        inactivityDuration: event.duration || '45 mins',
      },
      resolutionDetails: {
        resolutionReasons: dto.resolutionReason,
        resolutionNotes: dto.resolutionNotes,
      },
      statusIndication: statusToSet,
      updatedPatientStatus: dto.updatedPatientStatus,
      whatsNext: {
        viewPatientHistoryUrl: `/patients/${event.patient_id}/history`,
        viewMonitoringUrl: `/patients/${event.patient_id}/monitoring`,
      },
    };
  }

  // 1. Get Patient History List with Day & Status Filters
  async getPatientHistoryList(
    patientId: string, 
    dayFilter: HistoryDayFilter = HistoryDayFilter.ALL, 
    statusFilter: HistoryStatusFilter = HistoryStatusFilter.ALL
  ) {
    let query = this.supabase
      .from('activity_events')
      .select('*')
      .eq('patient_id', patientId);

    // Apply Day filter
    if (dayFilter === HistoryDayFilter.TODAY) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfDay.toISOString());
    } else if (dayFilter === HistoryDayFilter.YESTERDAY) {
      const startOfYesterday = new Date();
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date();
      endOfYesterday.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfYesterday.toISOString()).lt('created_at', endOfYesterday.toISOString());
    }

    // Apply Status filter
    if (statusFilter && statusFilter !== HistoryStatusFilter.ALL) {
      query = query.eq('resolved_status', statusFilter);
    }

    const { data: events, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Error fetching patient history: ${error.message}`);
      throw new BadRequestException('Failed to retrieve history');
    }

    return (events || []).map((e) => {
      const recordedDate = new Date(e.created_at);
      const timeStr = recordedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = recordedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const isRecorded = e.resolved_status === 'RESOLVED' || e.resolved_status === 'COMPLETED' ? 'Recorded' : 'Open';

      return {
        id: e.id,
        timeAndRecordingIndication: `${dateStr} ${timeStr} (${isRecorded})`,
        columnDetails: {
          detectionNameAndSource: `${e.event_type === 'INACTIVITY_DETECTION' ? 'Inactivity detected' : 'Movement detected'} - ${e.source || 'Activity Timeline'}`,
          resolutionReasonsAndLastChecked: `${e.resolution_reason || 'Pending resolution'} - Last checked recently`,
          resolutionNotesAndAlertType: `${e.resolution_notes || 'No notes added'} - ${e.event_type}`,
          alertSource: e.source || 'Activity Timeline',
          inactivityDuration: e.duration || '45 mins',
          statusIndication: e.resolved_status || 'OPEN',
        },
      };
    });
  }

  // 2. Get History Event Detail View
  async getHistoryEventDetail(eventId: string) {
    const { data: event, error } = await this.supabase
      .from('activity_events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (error || !event) {
      throw new NotFoundException('History event record not found');
    }

    const recordedDate = new Date(event.created_at);
    const formattedRecordedTime = recordedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
      ' - ' + recordedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: event.id,
      detectionName: event.event_type === 'INACTIVITY_DETECTION' ? 'Inactivity detected' : 'Movement detected',
      alertType: event.event_type,
      eventInformation: {
        recordedTime: formattedRecordedTime,
        inactivityDuration: event.duration || '45 mins',
      },
      resolutionDetails: {
        resolutionReason: event.resolution_reason || 'Pending review',
        resolutionNotes: event.resolution_notes || 'No resolution notes provided yet.',
      },
      eventStatus: event.resolved_status || 'OPEN',
    };
  }
}