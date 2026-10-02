import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum Role {
  CAREGIVER = 'CAREGIVER',
  HEALTHCARE_PROFESSIONAL = 'HEALTHCARE_PROFESSIONAL',
}

export class SignupDto {
  @ApiProperty({ enum: Role, description: 'User role: CAREGIVER or HEALTHCARE_PROFESSIONAL' })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ description: 'Work Email Address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Direct Phone Number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  medicalLicenseId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Email or Phone Number' })
  @IsNotEmpty()
  @IsString()
  identifier!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Work Email Address' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}