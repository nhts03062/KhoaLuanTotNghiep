import { BadRequestException, Injectable } from '@nestjs/common';
import { Role, UserPackageStatus, PtAssistRequestStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { AdminAnalyticsQueryDto } from './dto/admin-analytics-query.dto';

const ANALYTICS_TIMEZONE = 'Asia/Ho_Chi_Minh';

type TimeRange = { start: Date; endExclusive: Date };
type RevenueRow = {
  createdAt: Date;
  status: UserPackageStatus;
  packageId: string;
  packagePrice: number;
  packageName: string;
  branchId: string;
  branchName: string;
};

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveRange(q: AdminAnalyticsQueryDto): TimeRange {
    if (!!q.from !== !!q.to) {
      throw new BadRequestException('from and to must be provided together');
    }

    if (q.from && q.to) {
      const start = fromZonedTime(`${q.from}T00:00:00`, ANALYTICS_TIMEZONE);
      const endExclusive = fromZonedTime(`${q.to}T23:59:59.999`, ANALYTICS_TIMEZONE);
      const realEndExclusive = new Date(endExclusive.getTime() + 1);
      if (realEndExclusive <= start) {
        throw new BadRequestException('to must be greater than or equal to from');
      }
      return { start, endExclusive: realEndExclusive };
    }

    const now = new Date();
    const monthKey = formatInTimeZone(now, ANALYTICS_TIMEZONE, 'yyyy-MM');
    const [yearText, monthText] = monthKey.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const start = fromZonedTime(
      `${yearText}-${monthText}-01T00:00:00`,
      ANALYTICS_TIMEZONE,
    );
    const endExclusive = fromZonedTime(
      `${String(nextYear)}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`,
      ANALYTICS_TIMEZONE,
    );
    return { start, endExclusive };
  }

  private previousRange(range: TimeRange): TimeRange {
    const delta = range.endExclusive.getTime() - range.start.getTime();
    return {
      start: new Date(range.start.getTime() - delta),
      endExclusive: new Date(range.start.getTime()),
    };
  }

  private pctChange(current: number, previous: number): number | null {
    if (previous === 0) return current === 0 ? 0 : null;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private async getRevenueRows(
    range: TimeRange,
    q: AdminAnalyticsQueryDto,
  ): Promise<RevenueRow[]> {
    const rows = await this.prisma.userPackage.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lt: range.endExclusive,
        },
        ...(q.branchId ? { branchId: q.branchId } : {}),
        ...(q.packageId ? { packageId: q.packageId } : {}),
      },
      select: {
        createdAt: true,
        status: true,
        packageId: true,
        package: { select: { name: true, price: true } },
        branchId: true,
        branch: { select: { name: true } },
      },
    });

    return rows.map((r) => ({
      createdAt: r.createdAt,
      status: r.status,
      packageId: r.packageId,
      packagePrice: r.package.price,
      packageName: r.package.name,
      branchId: r.branchId,
      branchName: r.branch.name,
    }));
  }

  private summarizeRevenue(rows: RevenueRow[]) {
    const grossRevenue = rows.reduce((sum, r) => sum + r.packagePrice, 0);
    const activeRevenue = rows
      .filter((r) => r.status === UserPackageStatus.ACTIVE)
      .reduce((sum, r) => sum + r.packagePrice, 0);
    return {
      grossRevenue,
      activeRevenue,
      purchasesCount: rows.length,
    };
  }

  async getOverview(q: AdminAnalyticsQueryDto) {
    const range = this.resolveRange(q);
    const prev = this.previousRange(range);

    const [currentRows, prevRows, currentOps, prevOps] = await Promise.all([
      this.getRevenueRows(range, q),
      this.getRevenueRows(prev, q),
      this.getOperationsRaw(range, q),
      this.getOperationsRaw(prev, q),
    ]);

    const currentRevenue = this.summarizeRevenue(currentRows);
    const prevRevenue = this.summarizeRevenue(prevRows);

    return {
      message: 'Get admin analytics overview successfully',
      data: {
        range: {
          from: formatInTimeZone(range.start, ANALYTICS_TIMEZONE, 'yyyy-MM-dd'),
          to: formatInTimeZone(
            new Date(range.endExclusive.getTime() - 1),
            ANALYTICS_TIMEZONE,
            'yyyy-MM-dd',
          ),
        },
        metrics: {
          grossRevenue: currentRevenue.grossRevenue,
          activeRevenue: currentRevenue.activeRevenue,
          purchasesCount: currentRevenue.purchasesCount,
          newUsers: currentOps.newUsers,
          activePackages: currentOps.activePackages,
          checkins: currentOps.checkins,
          ptAcceptedSessions: currentOps.ptAcceptedSessions,
        },
        changeVsPreviousPeriod: {
          grossRevenuePct: this.pctChange(
            currentRevenue.grossRevenue,
            prevRevenue.grossRevenue,
          ),
          activeRevenuePct: this.pctChange(
            currentRevenue.activeRevenue,
            prevRevenue.activeRevenue,
          ),
          purchasesCountPct: this.pctChange(
            currentRevenue.purchasesCount,
            prevRevenue.purchasesCount,
          ),
          newUsersPct: this.pctChange(currentOps.newUsers, prevOps.newUsers),
          activePackagesPct: this.pctChange(
            currentOps.activePackages,
            prevOps.activePackages,
          ),
          checkinsPct: this.pctChange(currentOps.checkins, prevOps.checkins),
          ptAcceptedSessionsPct: this.pctChange(
            currentOps.ptAcceptedSessions,
            prevOps.ptAcceptedSessions,
          ),
        },
      },
    };
  }

  async getRevenueTimeseries(q: AdminAnalyticsQueryDto) {
    const range = this.resolveRange(q);
    const groupBy = q.groupBy ?? 'day';
    const rows = await this.getRevenueRows(range, q);
    const map = new Map<
      string,
      { grossRevenue: number; activeRevenue: number; purchasesCount: number }
    >();

    for (const r of rows) {
      const bucketFormat =
        groupBy === 'year' ? 'yyyy' : groupBy === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd';
      const bucket = formatInTimeZone(r.createdAt, ANALYTICS_TIMEZONE, bucketFormat);
      const current = map.get(bucket) ?? {
        grossRevenue: 0,
        activeRevenue: 0,
        purchasesCount: 0,
      };
      current.grossRevenue += r.packagePrice;
      if (r.status === UserPackageStatus.ACTIVE) {
        current.activeRevenue += r.packagePrice;
      }
      current.purchasesCount += 1;
      map.set(bucket, current);
    }

    const data = Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([bucket, value]) => ({
        bucket,
        ...value,
      }));

    return {
      message: 'Get revenue timeseries successfully',
      data,
    };
  }

  async getRevenueByBranch(q: AdminAnalyticsQueryDto) {
    const range = this.resolveRange(q);
    const rows = await this.getRevenueRows(range, q);
    const map = new Map<string, { branchId: string; branchName: string; revenue: number; purchasesCount: number }>();

    for (const r of rows) {
      const current = map.get(r.branchId) ?? {
        branchId: r.branchId,
        branchName: r.branchName,
        revenue: 0,
        purchasesCount: 0,
      };
      current.revenue += r.packagePrice;
      current.purchasesCount += 1;
      map.set(r.branchId, current);
    }

    return {
      message: 'Get revenue by branch successfully',
      data: Array.from(map.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }

  async getRevenueByPackage(q: AdminAnalyticsQueryDto) {
    const range = this.resolveRange(q);
    const rows = await this.getRevenueRows(range, q);
    const map = new Map<string, { packageId: string; packageName: string; revenue: number; purchasesCount: number }>();

    for (const r of rows) {
      const current = map.get(r.packageId) ?? {
        packageId: r.packageId,
        packageName: r.packageName,
        revenue: 0,
        purchasesCount: 0,
      };
      current.revenue += r.packagePrice;
      current.purchasesCount += 1;
      map.set(r.packageId, current);
    }

    return {
      message: 'Get revenue by package successfully',
      data: Array.from(map.values()).sort((a, b) => b.revenue - a.revenue),
    };
  }

  private async getOperationsRaw(range: TimeRange, q: AdminAnalyticsQueryDto) {
    const [newUsers, activePackages, checkins, ptAcceptedSessions] =
      await Promise.all([
        this.prisma.account.count({
          where: {
            role: Role.USER,
            createdAt: { gte: range.start, lt: range.endExclusive },
          },
        }),
        this.prisma.userPackage.count({
          where: {
            status: UserPackageStatus.ACTIVE,
            createdAt: { gte: range.start, lt: range.endExclusive },
            ...(q.branchId ? { branchId: q.branchId } : {}),
            ...(q.packageId ? { packageId: q.packageId } : {}),
          },
        }),
        this.prisma.checkIn.count({
          where: {
            checkedInAt: { gte: range.start, lt: range.endExclusive },
            ...(q.branchId ? { branchId: q.branchId } : {}),
          },
        }),
        this.prisma.ptAssistRequest.count({
          where: {
            status: PtAssistRequestStatus.ACCEPTED,
            startTime: { gte: range.start, lt: range.endExclusive },
            ...(q.branchId ? { branchId: q.branchId } : {}),
          },
        }),
      ]);

    return {
      newUsers,
      activePackages,
      checkins,
      ptAcceptedSessions,
    };
  }

  async getOperations(q: AdminAnalyticsQueryDto) {
    const range = this.resolveRange(q);
    return {
      message: 'Get admin operations metrics successfully',
      data: await this.getOperationsRaw(range, q),
    };
  }
}
