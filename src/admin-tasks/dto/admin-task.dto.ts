import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TaskPriority {
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  MEDIUM = 'MEDIUM',
}

export class LatestAlertDetectionItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Event/Task ID' })
  id!: string;

  @ApiProperty({ example: 'Possible Fall Detection', description: 'Detection name' })
  detection!: string;

  @ApiProperty({ example: 'UNASSIGNED', description: 'Task status e.g. UNASSIGNED, ASSIGNED, RESOLVED' })
  status!: string;

  @ApiProperty({ example: '18 mins ago', description: 'How long since alert was detected' })
  howLong!: string;

  @ApiProperty({ example: false, description: 'True if someone is assigned, false otherwise' })
  isAssigned!: boolean;

  @ApiPropertyOptional({ example: 'Nurse Amaka Okafor', description: 'Name of assigned staff if assigned' })
  assignedToName?: string;
}

export class TaskDetailsDto {
  @ApiProperty({ example: 'Jane Doe (PAT-1001)', description: 'Patient name + ID not assigned to a caregiver' })
  unassignedPatient!: string;

  @ApiProperty({ example: 'Ward B - Room 204', description: 'Event location' })
  eventLocation!: string;

  @ApiProperty({ example: 'STABLE - Resting after sudden movement', description: 'Patient safety condition' })
  patientSafety!: string;
}

export class AssignTaskDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Target Event/Task ID' })
  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @ApiProperty({ example: 'Prolonged inactivity verification', description: 'Task type (detection description or name)' })
  @IsNotEmpty()
  @IsString()
  taskType!: string;

  @ApiProperty({ example: '987f6543-e21b-12d3-a456-426614174000', description: 'UUID of chosen available responder' })
  @IsNotEmpty()
  @IsString()
  assignToUserId!: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH, description: 'Priority level (High, Normal, Medium)' })
  @IsNotEmpty()
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @ApiProperty({ example: '45 mins', description: 'Due by duration (in hrs or mins)' })
  @IsNotEmpty()
  @IsString()
  dueBy!: string;

  @ApiPropertyOptional({ example: 'Please perform manual bed check and verify vitals immediately.' })
  @IsOptional()
  @IsString()
  assignmentMessage?: string;
}

export class AvailableResponderDto {
  @ApiProperty({ example: '987f6543-e21b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'https://ui-avatars.com/api/?name=Nurse+Amaka', description: 'Responder profile pic' })
  pic!: string;

  @ApiProperty({ example: 'Amaka Okafor', description: 'Responder full name' })
  name!: string;

  @ApiProperty({ example: 'CAREGIVER', description: 'Professional title: CAREGIVER or HEALTHCARE_PROFESSIONAL' })
  professionalTitle!: string;

  @ApiProperty({ example: 'AVAILABLE', description: 'Duty status: ON_DUTY, AVAILABLE, or TASKED' })
  dutyStatus!: string;
}

export class AdminTaskPageResponseDto {
  @ApiProperty({ type: [LatestAlertDetectionItemDto], description: 'Latest alerts detection feed (Rule 1)' })
  latestAlertDetections!: LatestAlertDetectionItemDto[];

  @ApiProperty({ type: TaskDetailsDto, description: 'Task details (Rule 2)' })
  taskDetails!: TaskDetailsDto;

  @ApiProperty({ type: [AvailableResponderDto], description: 'Assign response grid of available responders (Rule 4)' })
  availableResponders!: AvailableResponderDto[];
}