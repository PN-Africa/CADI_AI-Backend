import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
    }),
  ],
  controllers: [DraftsController],
  providers: [DraftsService],
})
export class DraftsModule {}