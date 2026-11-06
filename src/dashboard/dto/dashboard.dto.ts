import { ApiProperty } from '@nestjs/swagger';

export class DashboardMetricsDto {
  @ApiProperty({ example: 12, description: 'Total patients under monitoring' })
  totalPatients!: number;

  @ApiProperty({ example: 2, description: 'Number of emergency patients' })
  emergencyPatients!: number;

  @ApiProperty({ example: 3, description: 'Number of patients needing attention' })
  needsAttentionPatients!: number;

  @ApiProperty({ example: 7, description: 'Number of normal status patients' })
  normalPatients!: number;

  @ApiProperty({ example: 4, description: 'Active alerts count' })
  activeAlerts!: number;
}

export class PatientStatusBreakdownDto {
  @ApiProperty({ example: 19, description: 'Count of normal status patients' })
  normal!: number;

  @ApiProperty({ example: 4, description: 'Count of patients needing attention' })
  needsAttention!: number;

  @ApiProperty({ example: 2, description: 'Count of emergency alert patients' })
  emergency!: number;
}

export class PatientListItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: 'PAT-1002', description: 'Unique Patient ID code' })
  patientId!: string;

  @ApiProperty({ example: 'Elevated heart rate and prolonged inactivity' })
  currentCondition!: string;

  @ApiProperty({ enum: ['NORMAL', 'NEEDS_ATTENTION', 'EMERGENCY'], example: 'EMERGENCY' })
  status!: string;
}

export class DashboardPatientSummaryItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe - PAT-1001' })
  patientIdentifier!: string;

  @ApiProperty({ example: 'EMERGENCY' })
  status!: string;

  @ApiProperty({ example: '15 mins' })
  waitingTime!: string;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardMetricsDto })
  metrics!: DashboardMetricsDto;

  @ApiProperty({ type: [DashboardPatientSummaryItemDto] })
  priorityPatients!: DashboardPatientSummaryItemDto[];

  @ApiProperty({ type: PatientStatusBreakdownDto, description: 'Data for the circular status chart' })
  statusBreakdown!: PatientStatusBreakdownDto;

  @ApiProperty({ type: [PatientListItemDto], description: 'Tabular list of monitored patients' })
  patients!: PatientListItemDto[];
}