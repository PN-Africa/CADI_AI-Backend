import { Body, Controller, Get, Post, Req, UnauthorizedException, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AdminTasksService } from './admin-tasks.service';
import { AdminTaskPageResponseDto, AssignTaskDto } from './dto/admin-task.dto';

@ApiTags('Admin Tasks')
@Controller('admin/tasks')
export class AdminTasksController {
  constructor(
    private readonly adminTasksService: AdminTasksService,
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
  @ApiOperation({ summary: 'Get Admin Task Page data (Rules 1, 2, 4)' })
  @ApiResponse({ status: 200, description: 'Admin task page data retrieved successfully', type: AdminTaskPageResponseDto })
  async getTaskPageData(@Req() req: any) {
    await this.authenticateAdmin(req);
    return await this.adminTasksService.getAdminTaskPageData();
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign task button action (Rules 3 & 4)' })
  @ApiResponse({ status: 200, description: 'Task successfully assigned to responder' })
  async assignTask(@Body() dto: AssignTaskDto, @Req() req: any) {
    const admin = await this.authenticateAdmin(req);
    return await this.adminTasksService.assignTask(admin.sub || admin.email, dto);
  }
}