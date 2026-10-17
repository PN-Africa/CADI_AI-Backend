import { Controller, Get, Req, UseGuards, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Get overview metrics, chart status breakdown, and patient table list' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data retrieved successfully', 
    type: DashboardResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid token' })
  async getDashboard(@Req() req: any) {
    // Extract Bearer token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // payload contains { sub: userId, role: userRole }
      return await this.dashboardService.getDashboardData(payload.sub, payload.role);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}