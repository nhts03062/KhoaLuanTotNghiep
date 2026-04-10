import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PtKpiAdminController } from './pt-kpi-admin.controller';
import { PtKpiPtController } from './pt-kpi-pt.controller';
import { PtKpiService } from './pt-kpi.service';

@Module({
  controllers: [PtKpiAdminController, PtKpiPtController],
  providers: [PtKpiService, PrismaService],
  exports: [PtKpiService],
})
export class PtKpiModule {}
