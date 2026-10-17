import { Controller, Get, Param, Query, Req, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { PatientsService } from './patients.service';
import { 
  PatientListItemResponseDto, 
  PatientDetailResponseDto, 
  MonitoringTabResponseDto, 
  ActivityEventItemDto, 
  ActivityQueryDto 
} from './dto/patient.dto';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly jwtService: JwtService,
  ) {}

  private async authenticateUser(req: any) {
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
  @ApiOperation({ summary: 'Get tabular list of patients (Rule 1)' })
  @ApiResponse({ status: 200, description: 'Patients list retrieved', type: [PatientListItemResponseDto] })
  async getPatientsList(@Req() req: any) {
    const user = await this.authenticateUser(req);
    return await this.patientsService.getPatientsList(user.sub, user.role);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get patient details view by ID (Rule 2)' })
  @ApiResponse({ status: 200, description: 'Patient details retrieved', type: PatientDetailResponseDto })
  async getPatientDetails(@Param('id') id: string, @Req() req: any) {
    await this.authenticateUser(req);
    return await this.patientsService.getPatientDetails(id);
  }

  @Get(':id/monitoring')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Monitoring tab charts & calculation (Rule 4)' })
  @ApiResponse({ status: 200, description: 'Monitoring tab data retrieved', type: MonitoringTabResponseDto })
  async getPatientMonitoring(@Param('id') id: string, @Req() req: any) {
    await this.authenticateUser(req);
    return await this.patientsService.getPatientMonitoring(id);
  }

  @Get(':id/activity')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Activity timeline with time range filter (Rule 5)' })
  @ApiResponse({ status: 200, description: 'Activity timeline retrieved', type: [ActivityEventItemDto] })
  async getPatientActivity(
    @Param('id') id: string, 
    @Query() query: ActivityQueryDto,
    @Req() req: any
  ) {
    await this.authenticateUser(req);
    return await this.patientsService.getPatientActivity(id, query.filter);
  }
}