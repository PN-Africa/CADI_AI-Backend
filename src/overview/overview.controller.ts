import { Controller, Get, Req, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { OverviewService } from './overview.service';
import { OverviewResponseDto } from './dto/overview.dto';

@ApiTags('Overview')
@Controller('overview')
export class OverviewController {
  constructor(
    private readonly overviewService: OverviewService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get overview patient summary metrics and prioritized patient list' })
  @ApiResponse({ 
    status: 200, 
    description: 'Overview data retrieved successfully', 
    type: OverviewResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid token' })
  async getOverview(@Req() req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      return await this.overviewService.getOverviewData(payload.sub, payload.role);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}