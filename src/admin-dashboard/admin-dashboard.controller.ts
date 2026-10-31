import { Body, Controller, Get, Post, Query, Param, Req, UnauthorizedException, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AdminDashboardService } from './admin-dashboard.service';
import { AlertQueueFilter, AdminDashboardResponseDto, SaveAdminNoteDto } from './dto/admin-dashboard.dto';
import { 
  AdminPatientListItemDto, 
  AdminPatientDetailResponseDto 
} from './dto/admin-patient.dto';


@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
    private readonly jwtService: JwtService,
  ) {}

  private async authenticateAdmin(req: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
      if (payload.role !== 'ADMIN') {
        throw new ForbiddenException('Access restricted to administrators only');
      }
      return payload;
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard metrics, alert queue, authorized users, and admin notes (Rules 1, 2, 3, 4, 5)' })
  @ApiResponse({ status: 200, description: 'Admin dashboard data retrieved successfully', type: AdminDashboardResponseDto })
  async getDashboard(
    @Query('filter') filter: AlertQueueFilter = AlertQueueFilter.ALL,
    @Req() req: any
  ) {
    await this.authenticateAdmin(req);
    return await this.adminDashboardService.getAdminDashboardData(filter);
  }

  @Post('notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save an admin operational note (Rule 5)' })
  @ApiResponse({ status: 201, description: 'Admin note saved successfully' })
  async saveNote(@Body() dto: SaveAdminNoteDto, @Req() req: any) {
    const admin = await this.authenticateAdmin(req);
    return await this.adminDashboardService.saveAdminNote(admin.email || 'admin@cadi.ai', dto);
  }

  @Get('patients')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of patients in a tabular form for admin portal (Rule 1)' })
  @ApiResponse({ status: 200, description: 'Admin patients list retrieved successfully', type: [AdminPatientListItemDto] })
  async getAdminPatientsList(@Req() req: any) {
    await this.authenticateAdmin(req);
    return await this.adminDashboardService.getAdminPatientsList();
  }

  @Get('patients/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get patient details when clicked from admin patient list (Rule 1)' })
  @ApiResponse({ status: 200, description: 'Patient details retrieved successfully', type: AdminPatientDetailResponseDto })
  async getAdminPatientDetails(@Param('id') id: string, @Req() req: any) {
    await this.authenticateAdmin(req);
    return await this.adminDashboardService.getAdminPatientDetails(id);
  }
}