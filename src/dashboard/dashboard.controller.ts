import { Controller, Get, Req, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user dashboard metrics and priority patients list' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully', type: DashboardResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(@Req() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      return await this.dashboardService.getUserDashboardData(payload.sub, payload.role);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}