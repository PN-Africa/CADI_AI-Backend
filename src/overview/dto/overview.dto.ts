import { ApiProperty } from '@nestjs/swagger';

export class OverviewSummaryDto {
  @ApiProperty({ example: 30, description: 'Total number of patients monitored' })
  totalPatients!: number;

  @ApiProperty({ example: 3, description: 'Number of Emergency patients' })
  emergencyPatients!: number;

  @ApiProperty({ example: 5, description: 'Number of patients that need attention' })
  needsAttentionPatients!: number;

  @ApiProperty({ example: 22, description: 'Number of Normal patients' })
  normalPatients!: number;
}

export class PrioritizedPatientItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe - PAT-1001', description: 'Patient name + ID number' })
  patientIdentifier!: string;

  @ApiProperty({ enum: ['NORMAL', 'NEEDS_ATTENTION', 'EMERGENCY'], example: 'EMERGENCY' })
  status!: string;

  @ApiProperty({ example: '25 mins', description: 'How many minutes they have been waiting' })
  waitingTime!: string;
}

export class OverviewResponseDto {
  @ApiProperty({ type: OverviewSummaryDto, description: 'Patient summary metrics' })
  summary!: OverviewSummaryDto;

  @ApiProperty({ type: [PrioritizedPatientItemDto], description: 'List of patients prioritized by urgency and waiting time' })
  prioritizedPatients!: PrioritizedPatientItemDto[];
}