import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
    }),
  ],
  controllers: [OverviewController],
  providers: [OverviewService],
})
export class OverviewModule {}