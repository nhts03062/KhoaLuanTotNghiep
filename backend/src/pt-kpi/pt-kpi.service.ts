import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AccountStatus,
  PtAssistRequestStatus,
  PtMonthlyRewardPayoutSource,
  Role,
} from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { PtMonthlyKpiQueryDto } from './dto/pt-monthly-kpi-query.dto';
import { UpdatePtMonthlyPayoutDto } from './dto/update-pt-monthly-payout.dto';
import { UpsertPtMonthlyKpiPolicyDto } from './dto/upsert-pt-monthly-kpi-policy.dto';

const KPI_TIMEZONE = 'Asia/Ho_Chi_Minh';

type KpiStats = { distinctTrainees: number; acceptedSessions: number };

@Injectable()
export class PtKpiService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveMonthKey(monthKey?: string): string {
    return monthKey ?? formatInTimeZone(new Date(), KPI_TIMEZONE, 'yyyy-MM');
  }

  private getMonthBounds(monthKey: string): { start: Date; end: Date } {
    const [yearText, monthText] = monthKey.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    const start = fromZonedTime(
      `${yearText}-${monthText}-01T00:00:00`,
      KPI_TIMEZONE,
    );
    const end = fromZonedTime(
      `${String(nextYear)}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`,
      KPI_TIMEZONE,
    );
    return { start, end };
  }

  getPreviousMonthKey(baseDate: Date = new Date()): string {
    const nowKey = formatInTimeZone(baseDate, KPI_TIMEZONE, 'yyyy-MM');
    const [yearText, monthText] = nowKey.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return `${String(prevYear)}-${String(prevMonth).padStart(2, '0')}`;
  }

  private async getStatsMap(monthKey: string): Promise<Map<string, KpiStats>> {
    const { start, end } = this.getMonthBounds(monthKey);
    const [sessionsByPt, distinctPairs] = await Promise.all([
      this.prisma.ptAssistRequest.groupBy({
        by: ['ptAccountId'],
        where: {
          status: PtAssistRequestStatus.ACCEPTED,
          startTime: { gte: start, lt: end },
        },
        _count: { _all: true },
      }),
      this.prisma.ptAssistRequest.findMany({
        where: {
          status: PtAssistRequestStatus.ACCEPTED,
          startTime: { gte: start, lt: end },
        },
        distinct: ['ptAccountId', 'accountId'],
        select: {
          ptAccountId: true,
          accountId: true,
        },
      }),
    ]);

    const stats = new Map<string, KpiStats>();
    for (const s of sessionsByPt) {
      stats.set(s.ptAccountId, {
        distinctTrainees: 0,
        acceptedSessions: s._count._all,
      });
    }

    for (const pair of distinctPairs) {
      const existing = stats.get(pair.ptAccountId) ?? {
        distinctTrainees: 0,
        acceptedSessions: 0,
      };
      existing.distinctTrainees += 1;
      stats.set(pair.ptAccountId, existing);
    }

    return stats;
  }

  private evaluateAchievement(
    stats: KpiStats,
    policy?: {
      targetTrainees: number;
      targetSessions: number;
      rewardAmount: number;
      isActive: boolean;
    } | null,
  ) {
    const achieved = Boolean(
      policy?.isActive &&
        stats.distinctTrainees >= policy.targetTrainees &&
        stats.acceptedSessions >= policy.targetSessions,
    );
    return {
      achieved,
      rewardAmountAuto: achieved ? (policy?.rewardAmount ?? 0) : 0,
    };
  }

  async upsertPolicy(adminId: string, dto: UpsertPtMonthlyKpiPolicyDto) {
    const monthKey = this.resolveMonthKey(dto.monthKey);
    const policy = await this.prisma.ptMonthlyKpiPolicy.upsert({
      where: { monthKey },
      update: {
        targetTrainees: dto.targetTrainees,
        targetSessions: dto.targetSessions,
        rewardAmount: dto.rewardAmount,
        isActive: dto.isActive ?? true,
      },
      create: {
        monthKey,
        targetTrainees: dto.targetTrainees,
        targetSessions: dto.targetSessions,
        rewardAmount: dto.rewardAmount,
        isActive: dto.isActive ?? true,
        createdByAdminId: adminId,
      },
      include: {
        createdByAdmin: {
          select: { id: true, email: true },
        },
      },
    });

    return { message: 'Upsert PT KPI policy successfully', data: policy };
  }

  async getPolicy(q: PtMonthlyKpiQueryDto) {
    const monthKey = this.resolveMonthKey(q.monthKey);
    const policy = await this.prisma.ptMonthlyKpiPolicy.findUnique({
      where: { monthKey },
      include: {
        createdByAdmin: {
          select: { id: true, email: true },
        },
      },
    });

    return { message: 'Get PT KPI policy successfully', data: policy };
  }

  async getMonthlySummary(q: PtMonthlyKpiQueryDto) {
    const monthKey = this.resolveMonthKey(q.monthKey);
    const [policy, statsMap, snapshots, payouts, pts] = await Promise.all([
      this.prisma.ptMonthlyKpiPolicy.findUnique({ where: { monthKey } }),
      this.getStatsMap(monthKey),
      this.prisma.ptMonthlyKpiSnapshot.findMany({ where: { monthKey } }),
      this.prisma.ptMonthlyRewardPayout.findMany({ where: { monthKey } }),
      this.prisma.account.findMany({
        where: {
          role: Role.PT,
          status: AccountStatus.ACTIVE,
        },
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, avatar: true } },
        },
      }),
    ]);

    const snapshotMap = new Map(snapshots.map((s) => [s.ptAccountId, s]));
    const payoutMap = new Map(payouts.map((p) => [p.ptAccountId, p]));

    const rows = pts.map((pt) => {
      const snapshot = snapshotMap.get(pt.id);
      const realtimeStats = statsMap.get(pt.id) ?? {
        distinctTrainees: 0,
        acceptedSessions: 0,
      };
      const usedStats = snapshot ?? realtimeStats;
      const evaluated = this.evaluateAchievement(usedStats, policy);
      const payout = payoutMap.get(pt.id) ?? null;

      return {
        ptAccountId: pt.id,
        email: pt.email,
        name: pt.profile?.name ?? null,
        avatar: pt.profile?.avatar ?? null,
        distinctTrainees: usedStats.distinctTrainees,
        acceptedSessions: usedStats.acceptedSessions,
        achieved: snapshot?.achieved ?? evaluated.achieved,
        rewardAmountAuto: snapshot?.rewardAmountAuto ?? evaluated.rewardAmountAuto,
        payout,
      };
    });

    return {
      message: 'Get PT KPI monthly summary successfully',
      data: {
        monthKey,
        policy,
        rows,
      },
    };
  }

  async getPtMonthlyKpi(ptAccountId: string, q: PtMonthlyKpiQueryDto) {
    const monthKey = this.resolveMonthKey(q.monthKey);
    const [policy, snapshot, payout, statsMap] = await Promise.all([
      this.prisma.ptMonthlyKpiPolicy.findUnique({ where: { monthKey } }),
      this.prisma.ptMonthlyKpiSnapshot.findUnique({
        where: { ptAccountId_monthKey: { ptAccountId, monthKey } },
      }),
      this.prisma.ptMonthlyRewardPayout.findUnique({
        where: { ptAccountId_monthKey: { ptAccountId, monthKey } },
      }),
      this.getStatsMap(monthKey),
    ]);

    const realtimeStats = statsMap.get(ptAccountId) ?? {
      distinctTrainees: 0,
      acceptedSessions: 0,
    };
    const stats = snapshot ?? realtimeStats;
    const evaluated = this.evaluateAchievement(stats, policy);
    const targetTrainees = policy?.targetTrainees ?? 0;
    const targetSessions = policy?.targetSessions ?? 0;

    return {
      message: 'Get PT KPI monthly stats successfully',
      data: {
        monthKey,
        distinctTrainees: stats.distinctTrainees,
        acceptedSessions: stats.acceptedSessions,
        kpiTarget: {
          targetTrainees,
          targetSessions,
          rewardAmount: policy?.rewardAmount ?? 0,
        },
        progress: {
          traineePercent:
            targetTrainees > 0
              ? Math.min(100, Math.floor((stats.distinctTrainees * 100) / targetTrainees))
              : 0,
          sessionPercent:
            targetSessions > 0
              ? Math.min(100, Math.floor((stats.acceptedSessions * 100) / targetSessions))
              : 0,
        },
        achieved: snapshot?.achieved ?? evaluated.achieved,
        estimatedReward: payout?.amountFinal ?? snapshot?.rewardAmountAuto ?? evaluated.rewardAmountAuto,
        payoutStatus: payout?.status ?? null,
      },
    };
  }

  async updatePayout(
    adminId: string,
    payoutId: string,
    dto: UpdatePtMonthlyPayoutDto,
  ) {
    const payout = await this.prisma.ptMonthlyRewardPayout.findUnique({
      where: { id: payoutId },
      select: { id: true },
    });
    if (!payout) {
      throw new NotFoundException('PT monthly payout not found');
    }

    const updated = await this.prisma.ptMonthlyRewardPayout.update({
      where: { id: payoutId },
      data: {
        ...(dto.amountFinal !== undefined ? { amountFinal: dto.amountFinal } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        source: PtMonthlyRewardPayoutSource.MANUAL_OVERRIDE,
        approvedByAdminId: adminId,
      },
      include: {
        approvedByAdmin: {
          select: { id: true, email: true },
        },
      },
    });

    return { message: 'Update PT monthly payout successfully', data: updated };
  }

  async finalizeMonth(monthKey: string) {
    const normalizedMonthKey = this.resolveMonthKey(monthKey);
    const [policy, statsMap, pts] = await Promise.all([
      this.prisma.ptMonthlyKpiPolicy.findUnique({
        where: { monthKey: normalizedMonthKey },
      }),
      this.getStatsMap(normalizedMonthKey),
      this.prisma.account.findMany({
        where: {
          role: Role.PT,
          status: AccountStatus.ACTIVE,
        },
        select: { id: true },
      }),
    ]);

    let processed = 0;
    for (const pt of pts) {
      const stats = statsMap.get(pt.id) ?? {
        distinctTrainees: 0,
        acceptedSessions: 0,
      };
      const evaluated = this.evaluateAchievement(stats, policy);

      const snapshot = await this.prisma.ptMonthlyKpiSnapshot.upsert({
        where: {
          ptAccountId_monthKey: {
            ptAccountId: pt.id,
            monthKey: normalizedMonthKey,
          },
        },
        update: {
          distinctTrainees: stats.distinctTrainees,
          acceptedSessions: stats.acceptedSessions,
          achieved: evaluated.achieved,
          rewardAmountAuto: evaluated.rewardAmountAuto,
          finalizedAt: new Date(),
        },
        create: {
          monthKey: normalizedMonthKey,
          ptAccountId: pt.id,
          distinctTrainees: stats.distinctTrainees,
          acceptedSessions: stats.acceptedSessions,
          achieved: evaluated.achieved,
          rewardAmountAuto: evaluated.rewardAmountAuto,
          finalizedAt: new Date(),
        },
      });

      const existingPayout = await this.prisma.ptMonthlyRewardPayout.findUnique({
        where: {
          ptAccountId_monthKey: {
            ptAccountId: pt.id,
            monthKey: normalizedMonthKey,
          },
        },
      });

      if (!existingPayout) {
        await this.prisma.ptMonthlyRewardPayout.create({
          data: {
            monthKey: normalizedMonthKey,
            ptAccountId: pt.id,
            snapshotId: snapshot.id,
            amountAuto: evaluated.rewardAmountAuto,
            amountFinal: evaluated.rewardAmountAuto,
          },
        });
      } else {
        await this.prisma.ptMonthlyRewardPayout.update({
          where: { id: existingPayout.id },
          data: {
            snapshotId: snapshot.id,
            amountAuto: evaluated.rewardAmountAuto,
            ...(existingPayout.source === PtMonthlyRewardPayoutSource.AUTO
              ? { amountFinal: evaluated.rewardAmountAuto }
              : {}),
          },
        });
      }

      processed += 1;
    }

    return {
      message: 'Finalize PT monthly KPI successfully',
      data: {
        monthKey: normalizedMonthKey,
        processed,
      },
    };
  }

  async finalizePreviousMonth() {
    const monthKey = this.getPreviousMonthKey();
    return this.finalizeMonth(monthKey);
  }
}
