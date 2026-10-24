import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum NotificationSortFilter {
  NEWEST = 'newest',
  OLD = 'old',
  ALPHABET = 'alphabet',
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ enum: NotificationSortFilter, default: NotificationSortFilter.NEWEST })
  @IsOptional()
  @IsEnum(NotificationSortFilter)
  sort?: NotificationSortFilter;
}

export class NotificationSummaryDto {
  @ApiProperty({ example: 12, description: 'Total number of alerts' })
  numberOfAlerts!: number;

  @ApiProperty({ example: 4, description: 'Number of unread notifications' })
  numberOfUnread!: number;

  @ApiProperty({ example: 3, description: 'Number of Urgent alerts' })
  numberOfUrgent!: number;

  @ApiProperty({ example: 9, description: 'Number of alerts to follow-up' })
  numberOfFollowUp!: number;

  @ApiProperty({ example: 8, description: 'Number of read notifications' })
  numberOfRead!: number;
}

export class NotificationFeedItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Event ID for review action' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe - PAT-1001', description: 'Patient Name + ID column' })
  patientNameAndId!: string;

  @ApiProperty({ example: 'Urgent', description: 'Alert type column (Urgent or Follow-up)' })
  alertType!: string;

  @ApiProperty({ example: 'unread', description: 'Status column (read or unread)' })
  status!: string;

  @ApiProperty({ example: '/patients/events/123e4567-e89b-12d3-a456-426614174000', description: 'Action URL/Button to review alert' })
  reviewAlertAction!: string;
}

export class NotificationResponseDto {
  @ApiProperty({ type: NotificationSummaryDto, description: 'Top summary metrics' })
  summary!: NotificationSummaryDto;

  @ApiProperty({ type: [NotificationFeedItemDto], description: 'Tabular caregiver notification feed' })
  notifications!: NotificationFeedItemDto[];
}