import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { AdminAnalyticsQueryDto } from './dto/admin-analytics-query.dto';
import { AdminAnalyticsService } from './admin-analytics.service';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('overview')
  getOverview(@Query() q: AdminAnalyticsQueryDto) {
    return this.adminAnalyticsService.getOverview(q);
  }

  @Get('revenue/timeseries')
  getRevenueTimeseries(@Query() q: AdminAnalyticsQueryDto) {
    return this.adminAnalyticsService.getRevenueTimeseries(q);
  }

  @Get('revenue/by-branch')
  getRevenueByBranch(@Query() q: AdminAnalyticsQueryDto) {
    return this.adminAnalyticsService.getRevenueByBranch(q);
  }

  @Get('revenue/by-package')
  getRevenueByPackage(@Query() q: AdminAnalyticsQueryDto) {
    return this.adminAnalyticsService.getRevenueByPackage(q);
  }

  @Get('operations')
  getOperations(@Query() q: AdminAnalyticsQueryDto) {
    return this.adminAnalyticsService.getOperations(q);
  }
}
