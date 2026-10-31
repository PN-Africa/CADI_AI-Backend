import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { DraftsService } from './drafts.service';
import { CreateDraftDto, DraftResponseDto } from './dto/draft.dto';

@ApiTags('Drafts')
@Controller('drafts')
export class DraftsController {
  constructor(
    private readonly draftsService: DraftsService,
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or save a new patient draft (Rules 1, 2, 3)' })
  @ApiResponse({ status: 201, description: 'Draft saved successfully', type: DraftResponseDto })
  async createDraft(@Body() dto: CreateDraftDto, @Req() req: any) {
    const user = await this.authenticate(req);
    return await this.draftsService.createOrUpdateDraft(user.sub, dto);
  }

  @Get(':draftId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get draft by ID' })
  @ApiResponse({ status: 200, description: 'Draft details retrieved', type: DraftResponseDto })
  async getDraftById(@Param('draftId') draftId: string, @Req() req: any) {
    await this.authenticate(req);
    return await this.draftsService.getDraftById(draftId);
  }

  @Get('patient/:patientId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all drafts for a specific patient' })
  @ApiResponse({ status: 200, description: 'List of drafts retrieved', type: [DraftResponseDto] })
  async getDraftsByPatient(@Param('patientId') patientId: string, @Req() req: any) {
    await this.authenticate(req);
    return await this.draftsService.getDraftsByPatient(patientId);
  }
}