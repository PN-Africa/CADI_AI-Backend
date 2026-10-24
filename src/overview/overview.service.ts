import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class OverviewService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(OverviewService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async getOverviewData(userId: string, userRole: string) {
    let query = this.supabase.from('patients').select('*');

    // If logged in as caregiver, filter by assigned patients
    if (userRole === 'CAREGIVER') {
      query = query.eq('assigned_caregiver_id', userId);
    }

    const { data: patients, error } = await query;

    if (error) {
      this.logger.error(`Error fetching overview data: ${error.message}`);
      throw new Error('Failed to retrieve overview data');
    }

    const patientList = patients || [];

    let totalPatients = patientList.length;
    let emergencyPatients = 0;
    let needsAttentionPatients = 0;
    let normalPatients = 0;

    const mappedPatients = patientList.map((p) => {
      if (p.status === 'EMERGENCY') {
        emergencyPatients++;
      } else if (p.status === 'NEEDS_ATTENTION') {
        needsAttentionPatients++;
      } else {
        normalPatients++;
      }

      // Calculate minutes waiting based on updated_at
      const diffMs = new Date().getTime() - new Date(p.updated_at).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));

      // Assign priority weight: EMERGENCY (3) > NEEDS_ATTENTION (2) > NORMAL (1)
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

    // Sort: highest priority status first, then longest waiting time
    mappedPatients.sort((a, b) => {
      if (b.priorityWeight !== a.priorityWeight) {
        return b.priorityWeight - a.priorityWeight;
      }
      return b.waitingMins - a.waitingMins;
    });

    const prioritizedPatients = mappedPatients.map(({ id, patientIdentifier, status, waitingTime }) => ({
      id,
      patientIdentifier,
      status,
      waitingTime,
    }));

    return {
      summary: {
        totalPatients,
        emergencyPatients,
        needsAttentionPatients,
        normalPatients,
      },
      prioritizedPatients,
    };
  }
}