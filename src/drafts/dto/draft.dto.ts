import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum DraftPriority {
  EMERGENCY = 'EMERGENCY',
  NEEDS_ATTENTION = 'NEEDS_ATTENTION',
  NORMAL = 'NORMAL',
}

export enum ResolutionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum NextReviewStatus {
  SCHEDULED = 'SCHEDULED',
  NOT_SCHEDULED = 'NOT_SCHEDULED',
}

export class CreateAttachmentDto {
  @ApiProperty({ example: 'medical_report.pdf' })
  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @ApiProperty({ example: 'https://storage.supabase.co/buckets/drafts/medical_report.pdf' })
  @IsNotEmpty()
  @IsString()
  fileUrl!: string;

  @ApiPropertyOptional({ example: '2.4 MB' })
  @IsOptional()
  @IsString()
  fileSize?: string;
}

export class CreateDraftDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Patient UUID' })
  @IsNotEmpty()
  @IsString()
  patientId!: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Patient name (Rule 1)' })
  @IsNotEmpty()
  @IsString()
  patientName!: string;

  @ApiProperty({ example: 'Nurse Amaka Okafor', description: 'Caregiver assigned (Rule 1)' })
  @IsNotEmpty()
  @IsString()
  caregiverAssigned!: string;

  @ApiProperty({ enum: DraftPriority, example: DraftPriority.EMERGENCY, description: 'Priority level (Rule 1)' })
  @IsNotEmpty()
  @IsEnum(DraftPriority)
  priority!: DraftPriority;

  @ApiProperty({ example: '2026-10-31T14:30:00Z', description: 'Last update day and time (Rule 1)' })
  @IsNotEmpty()
  @IsString()
  lastUpdate!: string;

  @ApiProperty({ example: 'Patient exhibited sudden movement followed by a resting period.', description: 'Caregiver observations/notes (Rule 1)' })
  @IsNotEmpty()
  @IsString()
  notes!: string;

  @ApiPropertyOptional({ type: [CreateAttachmentDto], description: 'List of file attachments (Rule 2)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttachmentDto)
  attachments?: CreateAttachmentDto[];

  @ApiProperty({ enum: ResolutionStatus, example: ResolutionStatus.CLOSED, description: 'Resolution status: CLOSED or OPEN (Rule 3)' })
  @IsNotEmpty()
  @IsEnum(ResolutionStatus)
  resolutionStatus!: ResolutionStatus;

  @ApiPropertyOptional({ example: 'Patient rested, vitals verified normal.', description: 'Resolution notes (Rule 3)' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiProperty({ enum: NextReviewStatus, example: NextReviewStatus.SCHEDULED, description: 'Next review schedule indicator (Rule 3)' })
  @IsNotEmpty()
  @IsEnum(NextReviewStatus)
  nextReview!: NextReviewStatus;
}

export class DraftResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  patientName!: string;

  @ApiProperty({ example: 'Nurse Amaka Okafor' })
  caregiverAssigned!: string;

  @ApiProperty({ enum: DraftPriority, example: 'EMERGENCY' })
  priority!: string;

  @ApiProperty({ example: 'October 31, 2026 - 02:30 PM' })
  lastUpdate!: string;

  @ApiProperty({ example: 'Patient exhibited sudden movement followed by a resting period.' })
  notes!: string;

  @ApiProperty({ type: [CreateAttachmentDto] })
  attachments!: CreateAttachmentDto[];

  @ApiProperty({ example: { resolutionStatus: 'CLOSED', resolutionNotes: 'Vitals stable', nextReview: 'SCHEDULED' } })
  resolutionEntry!: {
    resolutionStatus: string;
    resolutionNotes: string;
    nextReview: string;
  };
}