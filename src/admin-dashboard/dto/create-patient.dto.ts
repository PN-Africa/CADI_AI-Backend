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

export enum PatientGender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum EmergencyRelationship {
  SINGLE = 'single',
  MARRIED = 'married',
}

export enum PatientStatusEnum {
  NORMAL = 'NORMAL',
  NEEDS_ATTENTION = 'NEEDS_ATTENTION',
  EMERGENCY = 'EMERGENCY',
}

export class PersonalInformationDto {
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

  @ApiProperty({ enum: PatientGender, example: PatientGender.MALE })
  @IsNotEmpty()
  @IsEnum(PatientGender)
  gender!: PatientGender;

  @ApiProperty({ example: '+2348012345678' })
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  emailAddress!: string;

  @ApiProperty({ example: '12 Hospital Road, Victoria Island, Lagos' })
  @IsNotEmpty()
  @IsString()
  homeAddress!: string;
}

export class EmergencyContactDto {
  @ApiProperty({ example: 'Mary Doe' })
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @ApiProperty({ enum: EmergencyRelationship, example: EmergencyRelationship.MARRIED })
  @IsNotEmpty()
  @IsEnum(EmergencyRelationship)
  relationship!: EmergencyRelationship;

  @ApiProperty({ example: '+2348098765432' })
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;
}

export class CareSectionDto {
  @ApiProperty({ enum: PatientStatusEnum, example: PatientStatusEnum.NORMAL })
  @IsNotEmpty()
  @IsEnum(PatientStatusEnum)
  status!: PatientStatusEnum;

  @ApiProperty({ example: '987f6543-e21b-12d3-a456-426614174000', description: 'Caregiver UUID selected from dropdown' })
  @IsNotEmpty()
  @IsString()
  assignedCaregiverId!: string;

  @ApiProperty({ example: 'Penicillin, Peanuts' })
  @IsNotEmpty()
  @IsString()
  allergies!: string;

  @ApiPropertyOptional({ example: 'Patient requires extra mobility support during morning rounds.' })
  @IsOptional()
  @IsString()
  careNotes?: string;
}

export class CreatePatientDto {
  @ApiProperty({ type: PersonalInformationDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PersonalInformationDto)
  personalInformation!: PersonalInformationDto;

  @ApiProperty({ type: EmergencyContactDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact!: EmergencyContactDto;

  @ApiProperty({ type: CareSectionDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CareSectionDto)
  care!: CareSectionDto;
}

export class AvailableCaregiverDropdownItemDto {
  @ApiProperty({ example: '987f6543-e21b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'Nurse Amaka Okafor' })
  fullName!: string;

  @ApiProperty({ example: 'CAREGIVER' })
  role!: string;
}