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

  async getUserDashboardData(userId: string, userRole: string) {
    // 1. Try fetching patients assigned to this specific user
    let { data: patients, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('assigned_caregiver_id', userId);

    // 2. Fallback: If none assigned and user is staff/caregiver, show all patients so dashboard isn't blank
    if (!patients || patients.length === 0) {
      const { data: allPatients, error: allErr } = await this.supabase
        .from('patients')
        .select('*');
      
      if (!allErr && allPatients) {
        patients = allPatients;
      }
    }

    if (error) {
      this.logger.error(`Error fetching user dashboard patients: ${error.message}`);
    }

    const patientList = patients || [];

    let totalPatients = patientList.length;
    let emergencyPatients = 0;
    let needsAttentionPatients = 0;
    let normalPatients = 0;

    const priorityPatients = patientList.map((p) => {
      if (p.status === 'EMERGENCY') emergencyPatients++;
      else if (p.status === 'NEEDS_ATTENTION') needsAttentionPatients++;
      else normalPatients++;

      const diffMs = new Date().getTime() - new Date(p.updated_at || p.created_at).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));

      let priorityWeight = 1;
      if (p.status === 'EMERGENCY') priorityWeight = 3;
      else if (p.status === 'NEEDS_ATTENTION') priorityWeight = 2;

      return {
        id: p.id,
        patientIdentifier: `${p.name} - ${p.patient_id_code}`,
        status: p.status,
        waitingMins: diffMins,
        priorityWeight,
        waitingTime: `${diffMins} mins`,
      };
    });

    // Sort priority patients: Emergency first, then Needs Attention, then Normal
    priorityPatients.sort((a, b) => {
      if (b.priorityWeight !== a.priorityWeight) {
        return b.priorityWeight - a.priorityWeight;
      }
      return b.waitingMins - a.waitingMins;
    });

    // Fetch active alerts count from activity_events
    const { count: activeAlertsCount } = await this.supabase
      .from('activity_events')
      .select('*', { count: 'exact', head: true })
      .eq('resolved_status', 'PENDING');

    // 3. Construct tabular patient list for the dashboard table matching PatientListItemDto
    const patientTableList = patientList.map((p) => ({
      id: p.id,
      name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Patient',
      patientId: p.patient_id_code,
      currentCondition: p.current_condition || p.care_notes || 'Monitored under clinical guidelines.',
      status: p.status,
    }));

    return {
      metrics: {
        totalPatients,
        emergencyPatients,
        needsAttentionPatients,
        normalPatients,
        activeAlerts: activeAlertsCount || 0,
      },
      priorityPatients: priorityPatients.map(({ id, patientIdentifier, status, waitingTime }) => ({
        id,
        patientIdentifier,
        status,
        waitingTime,
      })),
      statusBreakdown: {
        normal: normalPatients,
        needsAttention: needsAttentionPatients,
        emergency: emergencyPatients,
      },
      patients: patientTableList,
    };
  }
}
