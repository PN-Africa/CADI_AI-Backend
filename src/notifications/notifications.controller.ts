import { Controller, Get, Query, Req, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto, NotificationResponseDto, NotificationSortFilter } from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get caregiver notification feed with top summary metrics and sort filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Notifications retrieved successfully', 
    type: NotificationResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid token' })
  async getNotifications(@Query() query: NotificationQueryDto, @Req() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      return await this.notificationsService.getNotifications(
        payload.sub, 
        payload.role, 
        query.sort || NotificationSortFilter.NEWEST
      );
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}