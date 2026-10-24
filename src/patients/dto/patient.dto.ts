import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ActivityFilter {
  TODAY = 'today',
  HOURS_24 = '24hrs',
  DAYS_7 = '7days',
}

export enum HistoryDayFilter {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  ALL = 'all',
}

export enum HistoryStatusFilter {
  ALL = 'all',
  RESOLVED = 'RESOLVED',
  OPEN = 'OPEN',
  COMPLETED = 'COMPLETED',
  DRAFT = 'DRAFT',
}

export class PatientListItemResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe (PAT-1001)', description: 'Displays Name + Patient ID' })
  patientDisplay!: string;

  @ApiProperty({ example: 'EMERGENCY', description: 'Current condition status' })
  status!: string;

  @ApiProperty({ example: '12 mins ago', description: 'Minutes since last attended/updated activity' })
  lastActivity!: string;
}

export class PatientDetailResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: 'PAT-1001' })
  patientIdCode!: string;

  @ApiProperty({ example: 72 })
  age!: number;

  @ApiProperty({ example: 'EMERGENCY' })
  status!: string;

  @ApiProperty({ example: '2026-10-17T14:30:00Z' })
  lastUpdated!: string;

  @ApiProperty({ example: 110, description: 'Heart rate in bpm' })
  heartRate!: number;

  @ApiProperty({ example: 94.5, description: 'Blood oxygen percentage' })
  bloodOxygen!: number;

  @ApiProperty({ example: 37.8, description: 'Temperature in Celsius' })
  temperature!: number;

  @ApiProperty({ example: 1.4, description: 'Movement in kilometers' })
  movementKm!: number;

  @ApiProperty({ example: {
    inactivityDetectedMins: 45,
    highTemperatureMins: 120,
    suddenMovementMins: 10,
    normalMovementMins: 3,
    positionChangeMins: 25
  }})
  minsSinceEvents!: {
    inactivityDetectedMins: number;
    highTemperatureMins: number;
    suddenMovementMins: number;
    normalMovementMins: number;
    positionChangeMins: number;
  };
}

export class MonitoringReadingPointDto {
  @ApiProperty({ example: '14:00' })
  timestamp!: string;

  @ApiProperty({ example: 78 })
  heartRate!: number;

  @ApiProperty({ example: 98.2 })
  bloodOxygen!: number;

  @ApiProperty({ example: 36.6 })
  temperature!: number;
}

export class MonitoringTabResponseDto {
  @ApiProperty({ type: [MonitoringReadingPointDto] })
  charts!: MonitoringReadingPointDto[];

  @ApiProperty({ example: '1.4 km today' })
  movementCalculation!: string;

  @ApiProperty({ example: 'NORMAL' })
  status!: string;
}

export class ActivityEventItemDto {
  @ApiProperty({ example: 'INACTIVITY_DETECTION' })
  eventType!: string;

  @ApiProperty({ example: 'Prolonged inactivity detected for 45 minutes.' })
  description!: string;

  @ApiProperty({ example: '2026-10-17T13:45:00Z' })
  timestamp!: string;
}

export class ActivityQueryDto {
  @ApiPropertyOptional({ enum: ActivityFilter, default: ActivityFilter.TODAY })
  @IsOptional()
  @IsEnum(ActivityFilter)
  filter?: ActivityFilter;
}

export class ActivityTimelineItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Event ID' })
  id!: string;

  @ApiProperty({ example: 'Movement detected', description: 'Detection column value' })
  detection!: string;

  @ApiProperty({ example: '2026-10-17T14:30:00Z', description: 'Timestamp of detection' })
  time!: string;
}

export class EventDetailResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Movement detected', description: 'Detection name' })
  detectionName!: string;

  @ApiProperty({ example: '2026-10-17T14:30:00Z' })
  time!: string;

  @ApiProperty({
    example: {
      recordedAt: 'October 17, 2026 - 02:30 PM',
      inactivityDuration: '45 mins',
      source: 'Activity Timeline',
    }
  })
  eventOverview!: {
    recordedAt: string;
    inactivityDuration: string;
    source: string;
  };

  @ApiPropertyOptional({ example: 'Patient walked around the room unassisted.' })
  caregiverNotes?: string;

  @ApiProperty({ example: 'RESOLVED', description: 'PENDING, DRAFT, or RESOLVED' })
  resolvedStatus!: string;
}

export class AddCaregiverNoteDto {
  @ApiProperty({ example: 'Caregiver observed patient resting comfortably after the alert.' })
  @IsNotEmpty()
  @IsString()
  note!: string;
}

export class ResolveEventDto {
  @ApiProperty({ example: 'Patient checked and confirmed stable by clinical staff.' })
  @IsNotEmpty()
  @IsString()
  resolutionReason!: string;

  @ApiProperty({ example: 'Continue normal monitoring schedule.' })
  @IsNotEmpty()
  @IsString()
  resolutionNotes!: string;

  @ApiProperty({ enum: ['NORMAL', 'NEEDS_ATTENTION', 'EMERGENCY'], example: 'NORMAL', description: 'New health status update for patient' })
  @IsNotEmpty()
  @IsEnum(['NORMAL', 'NEEDS_ATTENTION', 'EMERGENCY'])
  updatedPatientStatus!: string;

  @ApiProperty({ example: false, description: 'True to save as draft, false to fully resolve event' })
  @IsOptional()
  isDraft?: boolean;
}

export class EventResolvedResponseDto {
  @ApiProperty({ example: 'Event successfully resolved and patient status updated.' })
  message!: string;

  @ApiProperty({
    example: {
      detection: 'Movement detected',
      recordedAt: 'October 17, 2026 - 02:30 PM',
      inactivityDuration: '45 mins',
    }
  })
  eventSummaries!: {
    detection: string;
    recordedAt: string;
    inactivityDuration: string;
  };

  @ApiProperty({
    example: {
      resolutionReasons: 'Patient checked and confirmed stable.',
      resolutionNotes: 'Continue normal monitoring schedule.',
    }
  })
  resolutionDetails!: {
    resolutionReasons: string;
    resolutionNotes: string;
  };

  @ApiProperty({ example: 'RESOLVED' })
  statusIndication!: string;

  @ApiProperty({ example: 'NORMAL', description: 'Updated patient health status' })
  updatedPatientStatus!: string;

  @ApiProperty({
    example: {
      viewPatientHistoryUrl: '/patients/:id/history',
      viewMonitoringUrl: '/patients/:id/monitoring'
    }
  })
  whatsNext!: {
    viewPatientHistoryUrl: string;
    viewMonitoringUrl: string;
  };
}

export class HistoryQueryDto {
  @ApiPropertyOptional({ enum: HistoryDayFilter, default: HistoryDayFilter.ALL })
  @IsOptional()
  @IsEnum(HistoryDayFilter)
  day?: HistoryDayFilter;

  @ApiPropertyOptional({ enum: HistoryStatusFilter, default: HistoryStatusFilter.ALL })
  @IsOptional()
  @IsEnum(HistoryStatusFilter)
  status?: HistoryStatusFilter;
}

export class HistoryListItemResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'October 17, 2026 - 02:30 PM (Recorded)' })
  timeAndRecordingIndication!: string;

  @ApiProperty({
    example: {
      detectionNameAndSource: 'Inactivity detected - Activity Timeline',
      resolutionReasonsAndLastChecked: 'Checked and stable - Last checked 10 mins ago',
      resolutionNotesAndAlertType: 'Normal recovery - Fall Alert / Monitoring',
      alertSource: 'Activity Timeline',
      inactivityDuration: '45 mins',
      statusIndication: 'RESOLVED',
    }
  })
  columnDetails!: {
    detectionNameAndSource: string;
    resolutionReasonsAndLastChecked: string;
    resolutionNotesAndAlertType: string;
    alertSource: string;
    inactivityDuration: string;
    statusIndication: string;
  };
}

export class HistoryDetailResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Inactivity detected' })
  detectionName!: string;

  @ApiProperty({ example: 'Possible Fall / Inactivity Alert' })
  alertType!: string;

  @ApiProperty({
    example: {
      recordedTime: 'October 17, 2026 - 02:30 PM',
      inactivityDuration: '45 mins',
    }
  })
  eventInformation!: {
    recordedTime: string;
    inactivityDuration: string;
  };

  @ApiProperty({
    example: {
      resolutionReason: 'Patient checked and confirmed stable by clinical staff.',
      resolutionNotes: 'Continue normal monitoring schedule.',
    }
  })
  resolutionDetails!: {
    resolutionReason: string;
    resolutionNotes: string;
  };

  @ApiProperty({ example: 'RESOLVED' })
  eventStatus!: string;
}