import { Body, Controller, Get, Patch, Post, Put, Req, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { SettingsService } from './settings.service';
import { 
  UpdateProfileDto, 
  UpdateNotificationPreferencesDto, 
  ChangePasswordSettingsDto, 
  SettingsResponseDto 
} from './dto/settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
  ) {}

  private async authenticate(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }
    const token = authHeader.split(' ')[1];
    try {
      return await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile, notification preferences, and active devices' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully', type: SettingsResponseDto })
  async getSettings(@Req() req: any) {
    const user = await this.authenticate(req);
    return await this.settingsService.getUserSettings(user.sub);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save profile changes (Rule 1)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any) {
    const user = await this.authenticate(req);
    return await this.settingsService.updateProfile(user.sub, dto);
  }

  @Patch('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preference toggle choices (Rule 2)' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(@Body() dto: UpdateNotificationPreferencesDto, @Req() req: any) {
    const user = await this.authenticate(req);
    return await this.settingsService.updateNotificationPreferences(user.sub, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password action button (Rule 3)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Body() dto: ChangePasswordSettingsDto, @Req() req: any) {
    const user = await this.authenticate(req);
    return await this.settingsService.changePassword(user.sub, dto);
  }
}