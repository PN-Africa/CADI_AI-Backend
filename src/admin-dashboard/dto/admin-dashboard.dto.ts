import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AlertQueueFilter {
  ALL = 'all',
  CRITICAL = 'critical',
  MONITORED = 'monitored',
  RESOLVED = 'resolved',
}

export class AdminMetricsDto {
  @ApiProperty({ example: 45, description: 'Number of active patients (Rule 1)' })
  activePatients!: number;

  @ApiProperty({ example: 6, description: 'Number of active alerts (Rule 1)' })
  activeAlerts!: number;

  @ApiProperty({ example: '94.5%', description: 'Response SLA in percentage (Rule 1)' })
  responseSla!: string;

  @ApiProperty({ example: 50, description: 'Number of total patients (Rule 1)' })
  totalPatients!: number;

  @ApiProperty({ example: 5, description: 'How many critical patients/alerts (Rule 1)' })
  criticalCount!: number;

  @ApiProperty({ example: 45, description: 'How many monitored patients/alerts (Rule 1)' })
  monitoredCount!: number;
}

export class AlertQueueItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  patientName!: string;

  @ApiProperty({ example: 'EMERGENCY', description: 'Patient or alert status' })
  status!: string;

  @ApiProperty({ example: 'Possible fall detection', description: 'Detection type e.g. possible fall detection, response SLA approaching, assessment completed' })
  detection!: string;

  @ApiProperty({ example: '15 mins ago', description: 'How long since event/alert occurred' })
  howLong!: string;
}

export class AuthorizedUsersSummaryDto {
  @ApiProperty({ example: 12, description: 'Number of total users (caregivers and healthcare professionals)' })
  totalUsers!: number;

  @ApiProperty({ example: 2, description: 'Number of active admins' })
  activeAdmins!: number;

  @ApiProperty({ example: 3, description: 'Number of pending invites' })
  pendingInvites!: number;
}

export class QuickActionsDto {
  @ApiProperty({ example: '/admin/alerts/review' })
  reviewAlertsUrl!: string;

  @ApiProperty({ example: '/admin/history' })
  historyUrl!: string;

  @ApiProperty({ example: '/admin/reports/export' })
  exportReportUrl!: string;
}

export class SaveAdminNoteDto {
  @ApiProperty({ example: 'Billing reminder: Review monthly subscription tier updates.', description: 'Text area for admin note (Rule 5)' })
  @IsNotEmpty()
  @IsString()
  noteContent!: string;
}

export class AdminDashboardResponseDto {
  @ApiProperty({ type: AdminMetricsDto })
  metrics!: AdminMetricsDto;

  @ApiProperty({ type: [AlertQueueItemDto], description: 'Alert queue list (Rule 2)' })
  alertQueue!: AlertQueueItemDto[];

  @ApiProperty({ type: AuthorizedUsersSummaryDto, description: 'Authorized users metrics (Rule 3)' })
  authorizedUsers!: AuthorizedUsersSummaryDto;

  @ApiProperty({ type: QuickActionsDto, description: 'Quick action grid buttons (Rule 4)' })
  quickActions!: QuickActionsDto;

  @ApiProperty({ example: [{ id: '1', noteContent: 'Billing reminder...', createdAt: '2026-10-31T12:00:00Z' }], description: 'Saved admin notes (Rule 5)' })
  adminNotes!: Array<{ id: string; noteContent: string; createdAt: string }>;
}