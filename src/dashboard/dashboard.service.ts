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

    // 1. If user is a caregiver, first attempt to fetch assigned patients
    if (userRole === 'CAREGIVER' && userId && userId.length > 20) {
      try {
        const { data, error } = await this.supabase
          .from('patients')
          .select('*')
          .eq('assigned_caregiver_id', userId);

        if (!error && data) {
          patients = data;
        }
      } catch (e: any) {
        this.logger.warn(`Error querying assigned patients for caregiver: ${e.message}`);
      }
    }

    // 2. Fallback: If no assigned patients found (or user is a healthcare professional/admin), fetch all patients
    if (!patients || patients.length === 0) {
      const { data: allPatients, error: allErr } = await this.supabase
        .from('patients')
        .select('*')
        .order('updated_at', { ascending: false });

      if (allErr) {
        this.logger.error(`Error fetching all patients fallback: ${allErr.message}`);
      } else if (allPatients) {
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

      const lastActivityTime = new Date(p.updated_at || p.created_at || Date.now()).getTime();
      const diffMins = Math.max(1, Math.floor((Date.now() - lastActivityTime) / 60000));

      let priorityWeight = 1;
      if (statusUpper === 'EMERGENCY') priorityWeight = 3;
      else if (statusUpper === 'NEEDS_ATTENTION' || statusUpper === 'NEEDS ATTENTION') priorityWeight = 2;

      const patientName = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Patient';
      const patientCode = p.patient_id_code || 'PAT-0000';

      return {
        id: p.id,
        patientIdentifier: `${patientName} - ${patientCode}`,
        status: statusUpper,
        waitingMins: diffMins,
        priorityWeight,
        waitingTime: `${diffMins} mins`,
      };
    });

    // Sort priority queue: Emergency first, then Needs Attention, then Normal
    priorityPatients.sort((a, b) => {
      if (b.priorityWeight !== a.priorityWeight) {
        return b.priorityWeight - a.priorityWeight;
      }
      return b.waitingMins - a.waitingMins;
    });

    // 3. Fetch active pending alerts count from activity_events table
    const { count: activeAlertsCount, error: alertErr } = await this.supabase
      .from('activity_events')
      .select('*', { count: 'exact', head: true })
      .in('resolved_status', ['PENDING', 'OPEN', 'PENDING_REVIEW']);

    if (alertErr) {
      this.logger.error(`Error fetching active alerts count: ${alertErr.message}`);
    }

    // 4. Construct tabular patient list matching PatientListItemDto
    const patientTableList = patientList.map((p) => {
      const patientName = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Patient';
      const patientCode = p.patient_id_code || 'PAT-0000';
      const statusUpper = (p.status || 'NORMAL').toUpperCase();

      return {
        id: p.id,
        name: patientName,
        patientId: patientCode,
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
