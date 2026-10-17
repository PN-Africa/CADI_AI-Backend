import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DashboardService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(DashboardService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async getDashboardData(userId: string, userRole: string) {
    let query = this.supabase.from('patients').select('*');

    // If logged in user is a regular caregiver, filter by their assignments
    if (userRole === 'CAREGIVER') {
      query = query.eq('assigned_caregiver_id', userId);
    }

    const { data: patients, error } = await query;

    if (error) {
      this.logger.error(`Failed to fetch dashboard data: ${error.message}`);
      throw new Error('Could not retrieve dashboard metrics');
    }

    const patientList = patients || [];

    let totalPatientsMonitored = patientList.length;
    let totalPatientsNeedingAttention = 0;
    let totalEmergencyAlerts = 0;

    let normalCount = 0;
    let needsAttentionCount = 0;
    let emergencyCount = 0;

    const formattedPatients = patientList.map((p) => {
      if (p.status === 'NORMAL') {
        normalCount++;
      } else if (p.status === 'NEEDS_ATTENTION') {
        needsAttentionCount++;
      } else if (p.status === 'EMERGENCY') {
        emergencyCount++;
      }

      return {
        id: p.id,
        name: p.name,
        patientId: p.patient_id_code,
        currentCondition: p.current_condition || 'Stable condition',
        status: p.status,
      };
    });

    totalPatientsNeedingAttention = needsAttentionCount;
    totalEmergencyAlerts = emergencyCount;

    return {
      metrics: {
        totalPatientsMonitored,
        totalPatientsNeedingAttention,
        totalEmergencyAlerts,
      },
      statusBreakdown: {
        normal: normalCount,
        needsAttention: needsAttentionCount,
        emergency: emergencyCount,
      },
      patients: formattedPatients,
    };
  }
}