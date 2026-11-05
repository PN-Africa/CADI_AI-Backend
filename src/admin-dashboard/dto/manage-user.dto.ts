import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { user_role } from '@prisma/client'; 

export class UpdateUserDetailsDto {
  @ApiProperty({ example: 'Amaka' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'CAREGIVER', description: 'Role: caregiver or healthcare professional' })
  @IsNotEmpty()
  @IsString()
  role!: string;

  @ApiProperty({ example: 'amaka.okafor@cadi.ai' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ example: 'LIC-998877', description: 'License number' })
  @IsNotEmpty()
  @IsString()
  licenseNumber!: string;

  @ApiProperty({ example: 'Standard', description: 'Access level dropdown selection' })
  @IsNotEmpty()
  @IsString()
  accessLevel!: string;

  @ApiProperty({ example: 'Emergency Ward', description: 'Department dropdown selection' })
  @IsNotEmpty()
  @IsString()
  department!: string;

  @ApiProperty({ example: 'Team Alpha', description: 'Assigned team dropdown selection' })
  @IsNotEmpty()
  @IsString()
  assignedTeam!: string;

  @ApiProperty({ example: 'Group A - Geriatric', description: 'Patient group dropdown selection' })
  @IsNotEmpty()
  @IsString()
  patientGroup!: string;

  @ApiPropertyOptional({ example: 'Senior shift supervisor with specialized ICU training.' })
  @IsOptional()
  @IsString()
  notes?: string;
}