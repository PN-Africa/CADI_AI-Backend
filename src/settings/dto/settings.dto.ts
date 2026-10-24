import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Dr. John Doe', description: 'User full name' })
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'doctor@example.com', description: 'Work email address' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+1234567890', description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'Geriatric Care Unit A', description: 'Assigned care team' })
  @IsNotEmpty()
  @IsString()
  careTeam!: string;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ example: true, description: 'Push notification toggle' })
  @IsBoolean()
  pushNotifications!: boolean;

  @ApiProperty({ example: true, description: 'Email summaries toggle' })
  @IsBoolean()
  emailSummaries!: boolean;

  @ApiProperty({ example: false, description: 'SMS alerts toggle' })
  @IsBoolean()
  smsAlerts!: boolean;
}

export class ChangePasswordSettingsDto {
  @ApiProperty({ example: 'OldPassword123!', description: 'Current password' })
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password (min 6 chars)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}

export class SettingsResponseDto {
  @ApiProperty({ type: UpdateProfileDto })
  profile!: UpdateProfileDto;

  @ApiProperty({ type: UpdateNotificationPreferencesDto })
  notificationPreferences!: UpdateNotificationPreferencesDto;

  @ApiProperty({ 
    example: [{ deviceName: 'Chrome on Windows', lastActive: '2026-10-24T12:00:00Z', current: true }],
    description: 'Active sessions for review device action'
  })
  activeDevices!: Array<{ deviceName: string; lastActive: string; current: boolean }>;
}