import { Body, Controller, Get, Put, Req, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Get user or admin profile settings, notifications, and active devices' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully', type: SettingsResponseDto })
  async getSettings(@Req() req: any) {
    const payload = await this.authenticate(req);
    return await this.settingsService.getSettings(payload);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user or admin profile details' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any) {
    const payload = await this.authenticate(req);
    return await this.settingsService.updateProfile(payload, dto);
  }

  @Put('notifications')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences' })
  async updateNotifications(@Body() dto: UpdateNotificationPreferencesDto, @Req() req: any) {
    const payload = await this.authenticate(req);
    return await this.settingsService.updateNotificationPreferences(payload, dto);
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change account password' })
  async changePassword(@Body() dto: ChangePasswordSettingsDto, @Req() req: any) {
    const payload = await this.authenticate(req);
    return await this.settingsService.changePassword(payload, dto);
  }
}