import { Body, Controller, Get, Param, Query, Req, UnauthorizedException, HttpCode, HttpStatus, Patch, Post, ForbiddenException, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { PatientsService } from './patients.service';
import { 
  ActivityEventItemDto, 
  ActivityQueryDto,
  PatientListItemResponseDto, 
  PatientDetailResponseDto, 
  MonitoringTabResponseDto, 
  ActivityTimelineItemDto, 
  EventDetailResponseDto,
  AddCaregiverNoteDto,
  ResolveEventDto,
  EventResolvedResponseDto,
  HistoryQueryDto, 
  HistoryListItemResponseDto, 
  HistoryDetailResponseDto,
  HistoryDayFilter,
  HistoryStatusFilter,
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

  @Get(':id/activity-timeline')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity timeline list showing detection type and time' })
  @ApiResponse({ status: 200, description: 'Activity timeline retrieved', type: [ActivityTimelineItemDto] })
  async getPatientActivityTimeline(@Param('id') id: string, @Req() req: any) {
    await this.authenticateUser(req);
    return await this.patientsService.getPatientActivityTimeline(id);
  }

  @Get('events/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific event details when clicked from activity timeline' })
  @ApiResponse({ status: 200, description: 'Event details retrieved successfully', type: EventDetailResponseDto })
  async getEventDetails(@Param('eventId') eventId: string, @Req() req: any) {
    await this.authenticateUser(req);
    return await this.patientsService.getEventDetails(eventId);
  }

  @Post('events/:eventId/note')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add caregiver note to an event (Caregiver role only)' })
  @ApiResponse({ status: 200, description: 'Note added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only caregivers can add notes' })
  async addCaregiverNote(
    @Param('eventId') eventId: string, 
    @Body() dto: AddCaregiverNoteDto, 
    @Req() req: any
  ) {
    const user = await this.authenticateUser(req);
    if (user.role !== 'CAREGIVER') {
      throw new ForbiddenException('Only caregivers are permitted to record observation notes.');
    }
    return await this.patientsService.addCaregiverNote(eventId, user.sub, dto.note);
  }

  @Patch('events/:eventId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve details or save draft (Healthcare Professional role only)' })
  @ApiResponse({ status: 200, description: 'Event resolved or saved as draft', type: EventResolvedResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden: Only healthcare professionals can resolve events' })
  async resolveEvent(
    @Param('eventId') eventId: string, 
    @Body() dto: ResolveEventDto, 
    @Req() req: any
  ) {
    const user = await this.authenticateUser(req);
    if (user.role !== 'HEALTHCARE_PROFESSIONAL') {
      throw new ForbiddenException('Only healthcare professionals have permission to resolve events.');
    }
    return await this.patientsService.resolveEvent(eventId, user.sub, dto);
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get patient history tabular list with day and status filters (Rule 1 & 2)' })
  @ApiResponse({ status: 200, description: 'Patient history retrieved successfully', type: [HistoryListItemResponseDto] })
  async getPatientHistory(
    @Param('id') id: string,
    @Query() query: HistoryQueryDto,
    @Req() req: any
  ) {
    await this.authenticateUser(req);
    return await this.patientsService.getPatientHistoryList(
      id, 
      query.day || HistoryDayFilter.ALL, 
      query.status || HistoryStatusFilter.ALL
    );
  }

  @Get('history-events/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific history event details when "view event detail" is clicked (Rule 3)' })
  @ApiResponse({ status: 200, description: 'History event details retrieved successfully', type: HistoryDetailResponseDto })
  async getHistoryEventDetail(@Param('eventId') eventId: string, @Req() req: any) {
    await this.authenticateUser(req);
    return await this.patientsService.getHistoryEventDetail(eventId);
  }
}