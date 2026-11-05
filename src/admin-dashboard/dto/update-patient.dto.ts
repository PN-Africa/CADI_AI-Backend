import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsEmail, 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  ValidateNested 
} from 'class-validator';
import { PatientGender, PatientStatusEnum } from './create-patient.dto';

export class EditablePatientDetailsDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '1958-05-12', description: 'YYYY-MM-DD' })
  @IsNotEmpty()
  @IsString()
  dateOfBirth!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  emailAddress!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ enum: PatientGender, example: PatientGender.MALE })
  @IsNotEmpty()
  @IsEnum(PatientGender)
  gender!: PatientGender;
}

export class EditableClinicalInformationDto {
  @ApiProperty({ example: 'MRN-998877', description: 'Medical record number' })
  @IsNotEmpty()
  @IsString()
  medicalRecordNumber!: string;

  @ApiProperty({ example: 'Dr. Elizabeth Umoren', description: 'Primary care physician name' })
  @IsNotEmpty()
  @IsString()
  primaryCarePhysician!: string;

  @ApiProperty({ example: 'Cardiology North-wing', description: 'Team in charge e.g. Cardiology North-wing' })
  @IsNotEmpty()
  @IsString()
  careTeam!: string;

  @ApiProperty({ enum: PatientStatusEnum, example: PatientStatusEnum.NORMAL })
  @IsNotEmpty()
  @IsEnum(PatientStatusEnum)
  patientStatus!: PatientStatusEnum;

  @ApiPropertyOptional({ example: 'Patient responds well to daily cardiac monitoring routines.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePatientDto {
  @ApiProperty({ type: EditablePatientDetailsDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EditablePatientDetailsDto)
  patientDetails!: EditablePatientDetailsDto;

  @ApiProperty({ type: EditableClinicalInformationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EditableClinicalInformationDto)
  clinicalInformation!: EditableClinicalInformationDto;
}