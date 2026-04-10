import { Module } from '@nestjs/common';
import { CronjobService } from './cronjob.service';
import { CronjobController } from './cronjob.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PtKpiService } from 'src/pt-kpi/pt-kpi.service';

@Module({
  controllers: [CronjobController],
  providers: [CronjobService, PrismaService, PtKpiService],
})
export class CronjobModule {}
