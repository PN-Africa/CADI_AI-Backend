import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NotificationSortFilter } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(NotificationsService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async getNotifications(userId: string, userRole: string, sort: NotificationSortFilter = NotificationSortFilter.NEWEST) {
    let query = this.supabase
      .from('activity_events')
      .select('id, event_type, alert_severity, is_read, created_at, patients(name, patient_id_code, assigned_caregiver_id)');

    // If caregiver, filter by assigned patients
    if (userRole === 'CAREGIVER') {
      // Note: Supabase inner join filtering or post-filtering
    }

    const { data: events, error } = await query;

    if (error) {
      this.logger.error(`Error fetching notifications: ${error.message}`);
      throw new Error('Failed to retrieve notifications');
    }

    const eventList = events || [];

    // Calculate metrics
    let numberOfAlerts = eventList.length;
    let numberOfUnread = 0;
    let numberOfUrgent = 0;
    let numberOfFollowUp = 0;
    let numberOfRead = 0;

    const formattedNotifications = eventList.map((e: any) => {
      const isUrgent = (e.alert_severity || '').toUpperCase() === 'URGENT';
      const isRead = e.is_read === true;

      if (isRead) {
        numberOfRead++;
      } else {
        numberOfUnread++;
      }

      if (isUrgent) {
        numberOfUrgent++;
      } else {
        numberOfFollowUp++;
      }

      const patientName = e.patients?.name || 'Unknown Patient';
      const patientCode = e.patients?.patient_id_code || 'PAT-0000';

      return {
        id: e.id,
        patientNameAndId: `${patientName} - ${patientCode}`,
        alertType: isUrgent ? 'Urgent' : 'Follow-up',
        status: isRead ? 'read' : 'unread',
        reviewAlertAction: `/patients/events/${e.id}`,
        createdAt: new Date(e.created_at).getTime(),
        rawPatientName: patientName,
      };
    });

    // Apply sorting filters
    if (sort === NotificationSortFilter.NEWEST) {
      formattedNotifications.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === NotificationSortFilter.OLD) {
      formattedNotifications.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sort === NotificationSortFilter.ALPHABET) {
      formattedNotifications.sort((a, b) => a.rawPatientName.localeCompare(b.rawPatientName));
    }

    // Strip temporary sorting properties
    const notifications = formattedNotifications.map(({ createdAt, rawPatientName, ...rest }) => rest);

    return {
      summary: {
        numberOfAlerts,
        numberOfUnread,
        numberOfUrgent,
        numberOfFollowUp,
        numberOfRead,
      },
      notifications,
    };
  }
}