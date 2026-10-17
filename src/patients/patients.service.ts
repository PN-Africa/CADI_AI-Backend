import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ActivityFilter } from './dto/patient.dto';

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
}