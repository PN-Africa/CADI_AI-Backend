import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ActivityFilter {
  TODAY = 'today',
  HOURS_24 = '24hrs',
  DAYS_7 = '7days',
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