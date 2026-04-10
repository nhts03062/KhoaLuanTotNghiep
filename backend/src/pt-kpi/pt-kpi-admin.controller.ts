import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { PtMonthlyKpiQueryDto } from './dto/pt-monthly-kpi-query.dto';
import { UpdatePtMonthlyPayoutDto } from './dto/update-pt-monthly-payout.dto';
import { UpsertPtMonthlyKpiPolicyDto } from './dto/upsert-pt-monthly-kpi-policy.dto';
import { PtKpiService } from './pt-kpi.service';

@Controller('admin/pt-kpi')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PtKpiAdminController {
  constructor(private readonly ptKpiService: PtKpiService) {}

  @Post('policies')
  async upsertPolicy(
    @Req() req: any,
    @Body() dto: UpsertPtMonthlyKpiPolicyDto,
  ) {
    return this.ptKpiService.upsertPolicy(req.user.userId, dto);
  }

  @Get('policies')
  async getPolicy(@Query() q: PtMonthlyKpiQueryDto) {
    return this.ptKpiService.getPolicy(q);
  }

  @Get('monthly-summary')
  async getMonthlySummary(@Query() q: PtMonthlyKpiQueryDto) {
    return this.ptKpiService.getMonthlySummary(q);
  }

  @Patch('payouts/:id')
  async updatePayout(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePtMonthlyPayoutDto,
  ) {
    return this.ptKpiService.updatePayout(req.user.userId, id, dto);
  }
}
