import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminTasksController } from './admin-tasks.controller';
import { AdminTasksService } from './admin-tasks.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
    }),
  ],
  controllers: [AdminTasksController],
  providers: [AdminTasksService],
})
export class AdminTasksModule {}