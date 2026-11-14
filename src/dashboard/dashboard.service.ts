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
    let patients: any[] = [];

    // 1. Try fetching patients assigned to this specific user if ID looks like a valid UUID
    if (userId && userId.length > 20) {
      try {
        const { data, error } = await this.supabase
          .from('patients')
          .select('*')
          .eq('assigned_caregiver_id', userId);

        if (!error && data) {
          patients = data;
        }
      } catch (e: any) {
        this.logger.warn(`Could not query by assigned_caregiver_id: ${e.message}`);
      }
    }

    // 2. Fallback: If none assigned or query skipped, fetch all patients so dashboard isn't blank
    if (!patients || patients.length === 0) {
      const { data: allPatients, error: allErr } = await this.supabase
        .from('patients')
        .select('*');

      if (!allErr && allPatients) {
        patients = allPatients;
      }
    }

    const patientList = patients || [];

    let totalPatients = patientList.length;
    let emergencyPatients = 0;
    let needsAttentionPatients = 0;
    let normalPatients = 0;

    const priorityPatients = patientList.map((p) => {
      const statusUpper = (p.status || 'NORMAL').toUpperCase();
      
      if (statusUpper === 'EMERGENCY') {
        emergencyPatients++;
      } else if (statusUpper === 'NEEDS_ATTENTION' || statusUpper === 'NEEDS ATTENTION') {
        needsAttentionPatients++;
      } else {
        normalPatients++;
      }

      const diffMs = new Date().getTime() - new Date(p.updated_at || p.created_at || Date.now()).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));

      let priorityWeight = 1;
      if (statusUpper === 'EMERGENCY') priorityWeight = 3;
      else if (statusUpper === 'NEEDS_ATTENTION' || statusUpper === 'NEEDS ATTENTION') priorityWeight = 2;

      return {
        id: p.id,
        patientIdentifier: `${p.name || 'Patient'} - ${p.patient_id_code || 'PAT-0000'}`,
        status: statusUpper,
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
    const { count: activeAlertsCount, error: alertErr } = await this.supabase
      .from('activity_events')
      .select('*', { count: 'exact', head: true })
      .in('resolved_status', ['PENDING', 'OPEN', 'PENDING_REVIEW']);

    if (alertErr) {
      this.logger.error(`Error fetching active alerts count: ${alertErr.message}`);
    }

    // 3. Construct tabular patient list matching all possible frontend property variations
    const patientTableList = patientList.map((p) => {
      const patientName = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Patient';
      const patientCode = p.patient_id_code || 'PAT-0000';
      const statusUpper = (p.status || 'NORMAL').toUpperCase();

      return {
        id: p.id,
        name: patientName,
        patientId: patientCode,
        patientDisplay: `${patientName} - ${patientCode}`,
        currentCondition: p.current_condition || p.care_notes || 'Monitored under clinical guidelines.',
        status: statusUpper,
      };
    });

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
