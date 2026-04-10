import { Module } from '@nestjs/common';
import { ExcerciseService } from './excercise.service';
import { ExcerciseController } from './excercise.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ExcerciseController],
  providers: [ExcerciseService, PrismaService],
})
export class ExcerciseModule {}
