import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import { 
  UpdateProfileDto, 
  UpdateNotificationPreferencesDto, 
  ChangePasswordSettingsDto 
} from './dto/settings.dto';

@Injectable()
export class SettingsService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SettingsService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async getUserSettings(userId: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      profile: {
        fullName: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        careTeam: user.care_team || 'General Staff',
      },
      notificationPreferences: {
        pushNotifications: user.push_notifications ?? true,
        emailSummaries: user.email_summaries ?? true,
        smsAlerts: user.sms_alerts ?? false,
      },
      activeDevices: [
        {
          deviceName: 'Web Browser (Current Session)',
          lastActive: new Date().toISOString(),
          current: true,
        },
      ],
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { error } = await this.supabase
      .from('users')
      .update({
        full_name: dto.fullName,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        care_team: dto.careTeam,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      this.logger.error(`Failed to update profile: ${error.message}`);
      throw new BadRequestException('Failed to update profile details');
    }

    return { message: 'Profile updated successfully' };
  }

  async updateNotificationPreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    const { error } = await this.supabase
      .from('users')
      .update({
        push_notifications: dto.pushNotifications,
        email_summaries: dto.emailSummaries,
        sms_alerts: dto.smsAlerts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new BadRequestException('Failed to update notification preferences');
    }

    return { message: 'Notification preferences updated successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordSettingsDto) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        password: hashedNewPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw new BadRequestException('Failed to change password');
    }

    return { message: 'Password changed successfully. Please log in again.' };
  }
}