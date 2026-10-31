import { ApiProperty } from '@nestjs/swagger';

export class AdminPatientListItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Patient UUID for clicking/redirecting to details' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe - PAT-1001', description: 'Patient ID column showing name + alphanumeric ID' })
  patientIdColumn!: string;

  @ApiProperty({ enum: ['NORMAL', 'NEEDS_ATTENTION', 'EMERGENCY'], example: 'EMERGENCY', description: 'Status column' })
  status!: string;

  @ApiProperty({ example: '15 mins', description: 'Last activity in minutes' })
  lastActivity!: string;
}

export class AdminPatientDetailResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: 'PAT-1001' })
  patientIdCode!: string;

  @ApiProperty({ example: 68 })
  age!: number;

  @ApiProperty({ example: 'EMERGENCY' })
  status!: string;

  @ApiProperty({ example: 112, description: 'Heart rate' })
  heartRate!: number;

  @ApiProperty({ example: 95.0, description: 'Blood oxygen' })
  bloodOxygen!: number;

  @ApiProperty({ example: 37.5, description: 'Temperature' })
  temperature!: number;

  @ApiProperty({ example: '2026-10-31T12:00:00Z', description: 'Last updated timestamp' })
  lastUpdated!: string;
}