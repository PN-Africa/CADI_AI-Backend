import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateDraftDto } from './dto/draft.dto';

@Injectable()
export class DraftsService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(DraftsService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async createOrUpdateDraft(userId: string, dto: CreateDraftDto) {
    // 1. Insert patient draft record
    const { data: draft, error } = await this.supabase
      .from('patient_drafts')
      .insert({
        patient_id: dto.patientId,
        patient_name: dto.patientName,
        caregiver_assigned: dto.caregiverAssigned,
        priority: dto.priority,
        last_update: dto.lastUpdate,
        notes: dto.notes,
        resolution_status: dto.resolutionStatus,
        resolution_notes: dto.resolutionNotes || '',
        next_review: dto.nextReview,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !draft) {
      this.logger.error(`Error saving patient draft: ${error?.message}`);
      throw new BadRequestException('Failed to save patient draft');
    }

    // 2. Insert attachments if provided
    let savedAttachments: any[] = [];
    if (dto.attachments && dto.attachments.length > 0) {
      const attachmentsToInsert = dto.attachments.map((a) => ({
        draft_id: draft.id,
        file_name: a.fileName,
        file_url: a.fileUrl,
        file_size: a.fileSize || 'N/A',
      }));

      const { data: insertedAttachments, error: attachError } = await this.supabase
        .from('draft_attachments')
        .insert(attachmentsToInsert)
        .select();

      if (attachError) {
        this.logger.error(`Error saving attachments: ${attachError.message}`);
      } else {
        savedAttachments = insertedAttachments || [];
      }
    }

    // 3. Format date for response display
    const lastUpdateDate = new Date(draft.last_update);
    const formattedLastUpdate = lastUpdateDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
      ' - ' + lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      message: 'Draft saved successfully',
      draft: {
        id: draft.id,
        patientName: draft.patient_name,
        caregiverAssigned: draft.caregiver_assigned,
        priority: draft.priority,
        lastUpdate: formattedLastUpdate,
        notes: draft.notes,
        attachments: savedAttachments.map((sa) => ({
          fileName: sa.file_name,
          fileUrl: sa.file_url,
          fileSize: sa.file_size,
        })),
        resolutionEntry: {
          resolutionStatus: draft.resolution_status,
          resolutionNotes: draft.resolution_notes,
          nextReview: draft.next_review,
        },
      },
    };
  }

  async getDraftById(draftId: string) {
    const { data: draft, error } = await this.supabase
      .from('patient_drafts')
      .select('*, draft_attachments(*)')
      .eq('id', draftId)
      .maybeSingle();

    if (error || !draft) {
      throw new NotFoundException('Draft not found');
    }

    const lastUpdateDate = new Date(draft.last_update);
    const formattedLastUpdate = lastUpdateDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
      ' - ' + lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: draft.id,
      patientName: draft.patient_name,
      caregiverAssigned: draft.caregiver_assigned,
      priority: draft.priority,
      lastUpdate: formattedLastUpdate,
      notes: draft.notes,
      attachments: (draft.draft_attachments || []).map((a: any) => ({
        fileName: a.file_name,
        fileUrl: a.file_url,
        fileSize: a.file_size,
      })),
      resolutionEntry: {
        resolutionStatus: draft.resolution_status,
        resolutionNotes: draft.resolution_notes,
        nextReview: draft.next_review,
      },
    };
  }

  async getDraftsByPatient(patientId: string) {
    const { data: drafts, error } = await this.supabase
      .from('patient_drafts')
      .select('*, draft_attachments(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Error fetching patient drafts: ${error.message}`);
      throw new BadRequestException('Failed to retrieve drafts');
    }

    return (drafts || []).map((d) => {
      const lastUpdateDate = new Date(d.last_update);
      const formattedLastUpdate = lastUpdateDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + 
        ' - ' + lastUpdateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: d.id,
        patientName: d.patient_name,
        caregiverAssigned: d.caregiver_assigned,
        priority: d.priority,
        lastUpdate: formattedLastUpdate,
        notes: d.notes,
        attachments: (d.draft_attachments || []).map((a: any) => ({
          fileName: a.file_name,
          fileUrl: a.file_url,
          fileSize: a.file_size,
        })),
        resolutionEntry: {
          resolutionStatus: d.resolution_status,
          resolutionNotes: d.resolution_notes,
          nextReview: d.next_review,
        },
      };
    });
  }
}