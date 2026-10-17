import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
    }),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}