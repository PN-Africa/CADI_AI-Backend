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


export class BaseAuthResponseDto {
  @ApiProperty({ 
    example: 'Account created successfully. Please check your email to verify your account.',
    description: 'Response message'
  })
  message!: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'Login successful' })
  message!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiProperty({ enum: Role, example: Role.CAREGIVER })
  role!: Role;

  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'JWT Access Token to be sent in the Authorization header for protected routes' 
  })
  accessToken!: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'owner@gmail.com', description: 'Admin Gmail address' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}

export class VerifyAdminTokenDto {
  @ApiProperty({ description: 'Verification token sent via email' })
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({ example: 'Verification link sent to your email.' })
  message!: string;
}

export class AdminVerifyResponseDto {
  @ApiProperty({ example: 'Admin authentication successful' })
  message!: string;

  @ApiProperty({ example: 'ADMIN' })
  role!: string;

  @ApiProperty({ description: 'JWT Access Token' })
  accessToken!: string;
}