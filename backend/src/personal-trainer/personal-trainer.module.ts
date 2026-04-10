import { Module } from '@nestjs/common';
import { PersonalTrainerService } from './personal-trainer.service';
import { PersonalTrainerController } from './personal-trainer.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PersonalTrainerController],
  providers: [PersonalTrainerService, PrismaService],
})
export class PersonalTrainerModule {}
