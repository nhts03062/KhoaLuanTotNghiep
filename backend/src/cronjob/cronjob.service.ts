import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserPackageStatus } from 'generated/prisma/enums';
import { PtKpiService } from 'src/pt-kpi/pt-kpi.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CronjobService {
  private readonly logger = new Logger(CronjobService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly ptKpiService: PtKpiService,
  ) {}

  async expireUserPackages(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.userPackage.updateMany({
      where: {
        status: UserPackageStatus.ACTIVE,
        OR: [
          { AND: [{ endAt: { not: null } }, { endAt: { lt: now } }] },
          {
            AND: [
              { endAt: null },
              { expiredAt: { not: null } },
              { expiredAt: { lt: now } },
            ],
          },
        ],
      },
      data: {
        status: UserPackageStatus.EXPIRED,
      },
    });
    return result.count;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpireUserPackages() {
    try {
      const count = await this.expireUserPackages();
      if (count > 0) {
        this.logger.log(`Expired ${count} user package(s)`);
      }
    } catch (err) {
      this.logger.error('expireUserPackages failed', err);
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleFinalizePtMonthlyKpi() {
    try {
      const result = await this.ptKpiService.finalizePreviousMonth();
      this.logger.log(
        `Finalized PT KPI for ${result.data.monthKey}, processed ${result.data.processed} PT(s)`,
      );
    } catch (err) {
      this.logger.error('finalizePtMonthlyKpi failed', err);
    }
  }
}
