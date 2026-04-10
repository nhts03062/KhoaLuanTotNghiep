import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { PtMonthlyKpiQueryDto } from './dto/pt-monthly-kpi-query.dto';
import { PtKpiService } from './pt-kpi.service';

@Controller('pt/kpi')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PT)
export class PtKpiPtController {
  constructor(private readonly ptKpiService: PtKpiService) {}

  @Get('monthly')
  async getMonthlyKpi(@Req() req: any, @Query() q: PtMonthlyKpiQueryDto) {
    return this.ptKpiService.getPtMonthlyKpi(req.user.userId, q);
  }
}
