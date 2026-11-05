import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProfessionalListItemDto {
  @ApiProperty({ example: '987f6543-e21b-12d3-a456-426614174000', description: 'Professional User ID' })
  id!: string;

  @ApiProperty({ example: 'Nurse Amaka Okafor', description: 'Name column' })
  name!: string;

  @ApiProperty({ example: 'CAREGIVER', description: 'Role column (caregiver or healthcare professional)' })
  role!: string;

  @ApiProperty({ example: 'AVAILABLE', description: 'Availability column (on duty, available, busy)' })
  availability!: string;

  @ApiProperty({ example: 4, description: 'Current patients count in numbers' })
  currentPatientsCount!: number;

  @ApiProperty({ example: 'Assign', description: 'Action indicator for assigning professional' })
  action!: string;
}

export class AssignProfessionalToTaskDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Target Task/Event ID' })
  @IsNotEmpty()
  @IsString()
  taskId!: string;

  @ApiProperty({ example: '987f6543-e21b-12d3-a456-426614174000', description: 'Professional User ID to assign' })
  @IsNotEmpty()
  @IsString()
  professionalId!: string;

  @ApiPropertyOptional({ example: 'Assigned to urgent patient monitoring check in Ward A.' })
  @IsOptional()
  @IsString()
  assignmentMessage?: string;
}