import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PurchasePackageDto } from './dto/purchase-package.dto';
import { CreatePtAssistRequestDto } from './dto/create-pt-assist-request.dto';
import {
  AccountStatus,
  PtAssistRequestStatus,
  Role,
  UserPackageStatus,
  WorkoutHistoryStatus,
} from 'generated/prisma/enums';
import { PT_BOOKING_GRID_SLOTS } from 'src/pt-schedule/grid-slots.constants';
import {
  calendarDateOverlapsWindow,
  isoDowMon1Sun7ForCalendarDate,
  enumerateWeekDatesFromMonday,
  normalizeHhMm,
  PT_TIMEZONE,
  utcBoundsForCalendarSlot,
} from 'src/pt-schedule/pt-schedule.helpers';
import { fromZonedTime } from 'date-fns-tz';
import { calcEndAt } from 'src/utils/helpers';
import { CheckinPackageDto } from './dto/checkin-package.dto';
import { FilterPtTrainingHistoryDto } from './dto/filter-pt-training-history.dto';
import { formatInTimeZone } from 'date-fns-tz';
import { CreateWorkoutHistoryDto } from './dto/create-workout-history.dto';
import { FilterWorkoutHistoryDto } from './dto/filter-workout-history.dto';
import { FilterPtTrainingSlotsForUserDto } from './dto/filter-pt-training-slots.dto';
import { FilterAvailablePtDto } from './dto/filter-available-pt.dto';
import { PtWeekGridQueryDto } from './dto/pt-week-grid-query.dto';

@Injectable()
export class UserPackageService {
  constructor(private readonly prisma: PrismaService) {}

  private ptQuotaCap(
    ptSessionsGranted: number | null,
    pkg: { ptSessionsIncluded: number | null; hasPt: boolean },
  ): number | null {
    if (!pkg.hasPt) return null;
    const cap = ptSessionsGranted ?? pkg.ptSessionsIncluded ?? null;
    return cap != null && cap >= 1 ? cap : null;
  }

  private async enrichUserPackagesPtStats<
    T extends {
      id: string;
      ptSessionsGranted: number | null;
      package: { hasPt: boolean; ptSessionsIncluded: number | null };
    },
  >(userPackages: T[]) {
    const ptPkgIds = userPackages
      .filter((up) => up.package.hasPt)
      .map((up) => up.id);

    let usedMap = new Map<string, number>();
    if (ptPkgIds.length > 0) {
      const usages = await this.prisma.ptAssistRequest.groupBy({
        by: ['userPackageId'],
        where: {
          userPackageId: { in: ptPkgIds },
          status: {
            in: [PtAssistRequestStatus.PENDING, PtAssistRequestStatus.ACCEPTED],
          },
        },
        _count: { _all: true },
      });
      usedMap = new Map(usages.map((u) => [u.userPackageId, u._count._all]));
    }

    return userPackages.map((up) => {
      if (!up.package.hasPt) return up;
      const cap = this.ptQuotaCap(up.ptSessionsGranted, up.package);
      const used = usedMap.get(up.id) ?? 0;
      const remaining = cap != null ? Math.max(0, cap - used) : null;
      return {
        ...up,
        ptSessionsRemaining: remaining,
        ptAssistSessionsUsed: used,
      };
    });
  }

  async getAvailablePTs(filter: FilterAvailablePtDto) {
    const { branchId, from, to, search } = filter;

    const windowWhere = {
      branchId,
      isActive: true,
      weeklySlots: { some: { isAvailable: true } },
      ...(from
        ? { toDate: { gte: fromZonedTime(`${from}T00:00:00`, PT_TIMEZONE) } }
        : {}),
      ...(to
        ? {
            fromDate: {
              lte: fromZonedTime(`${to}T23:59:59.999`, PT_TIMEZONE),
            },
          }
        : {}),
    };

    const baseFilter = {
      role: Role.PT,
      status: AccountStatus.ACTIVE,
      ptAvailabilityWindows: {
        some: windowWhere,
      },
    };

    const pts = await this.prisma.account.findMany({
      where: search?.length
        ? {
            AND: [
              baseFilter,
              {
                OR: [
                  { email: { contains: search, mode: 'insensitive' } },
                  {
                    profile: {
                      name: { contains: search, mode: 'insensitive' },
                    },
                  },
                ],
              },
            ],
          }
        : baseFilter,
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            name: true,
            phone: true,
            avatar: true,
            height: true,
            weight: true,
            fitnessGoal: true,
            gender: true,
            dateOfBirth: true,
          },
        },
        ptAvailabilityWindows: {
          where: windowWhere,
          orderBy: { fromDate: 'asc' },
          select: {
            id: true,
            fromDate: true,
            toDate: true,
            branch: {
              select: { id: true, name: true, address: true },
            },
            weeklySlots: {
              where: { isAvailable: true },
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Get available PTs successfully',
      data: pts,
    };
  }

  async getPtWeekBookingGrid(dto: PtWeekGridQueryDto) {
    const { branchId, ptAccountId, weekStart } = dto;

    if (isoDowMon1Sun7ForCalendarDate(weekStart) !== 1) {
      throw new BadRequestException(
        'weekStart must be Monday (calendar date yyyy-MM-dd in Asia/Ho_Chi_Minh)',
      );
    }

    const pt = await this.prisma.account.findFirst({
      where: {
        id: ptAccountId,
        role: Role.PT,
        status: AccountStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (!pt) {
      throw new NotFoundException('PT not found or inactive');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, isActive: true },
      select: { id: true, name: true, address: true },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const weekDates = enumerateWeekDatesFromMonday(weekStart);
    const weekRangeStart = fromZonedTime(`${weekStart}T00:00:00`, PT_TIMEZONE);
    const weekRangeEndInclusive = fromZonedTime(
      `${weekDates[6]}T23:59:59.999`,
      PT_TIMEZONE,
    );

    const windows = await this.prisma.ptAvailabilityWindow.findMany({
      where: {
        ptAccountId,
        branchId,
        isActive: true,
        weeklySlots: { some: { isAvailable: true } },
        fromDate: { lte: weekRangeEndInclusive },
        toDate: { gte: weekRangeStart },
      },
      include: {
        weeklySlots: {
          where: { isAvailable: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    const bookings = await this.prisma.ptAssistRequest.findMany({
      where: {
        ptAccountId,
        branchId,
        status: {
          in: [PtAssistRequestStatus.PENDING, PtAssistRequestStatus.ACCEPTED],
        },
        startTime: { lte: weekRangeEndInclusive },
        endTime: { gte: weekRangeStart },
      },
      select: { startTime: true, endTime: true },
    });

    const now = new Date();
    const days = weekDates.map((dateStr) => {
      const dow = isoDowMon1Sun7ForCalendarDate(dateStr);

      const applicableSlotsAllWindows: Array<{
        id: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }> = [];
      for (const w of windows) {
        if (!calendarDateOverlapsWindow(dateStr, w.fromDate, w.toDate)) {
          continue;
        }
        for (const s of w.weeklySlots) {
          if (s.dayOfWeek === dow) applicableSlotsAllWindows.push(s);
        }
      }

      const slotsPayload = PT_BOOKING_GRID_SLOTS.map((row) => {
        const rowStart = normalizeHhMm(row.startTime);
        const rowEnd = normalizeHhMm(row.endTime);
        const match = applicableSlotsAllWindows.find(
          (s) =>
            normalizeHhMm(s.startTime) === rowStart &&
            normalizeHhMm(s.endTime) === rowEnd,
        );

        if (!match) {
          return {
            gridKey: row.key,
            startTime: row.startTime,
            endTime: row.endTime,
            weeklySlotId: null as string | null,
            state: 'UNAVAILABLE' as const,
          };
        }

        const bounds = utcBoundsForCalendarSlot(
          dateStr,
          row.startTime,
          row.endTime,
        );

        const occupied = bookings.some(
          (b) =>
            b.startTime.getTime() === bounds.start.getTime() &&
            b.endTime.getTime() === bounds.end.getTime(),
        );

        let state: 'FREE' | 'PASSED' | 'OCCUPIED' | 'UNAVAILABLE';
        if (occupied) state = 'OCCUPIED';
        else if (now > bounds.end) state = 'PASSED';
        else state = 'FREE';

        return {
          gridKey: row.key,
          startTime: row.startTime,
          endTime: row.endTime,
          weeklySlotId: match.id,
          state,
        };
      });

      return {
        date: dateStr,
        dayOfWeek: dow,
        slots: slotsPayload,
      };
    });

    return {
      message: 'Get PT week booking grid successfully',
      data: {
        timeZone: PT_TIMEZONE,
        weekStart,
        branch,
        ptAccountId,
        gridRows: [...PT_BOOKING_GRID_SLOTS],
        days,
      },
    };
  }

  private getProgramDayOfWeekToday(): number {
    // ProgramDay.dayOfWeek is 1..7 (based on CreateProgramDayDto validation)
    // JS getDay(): 0..6 with Sunday=0 => map Sunday -> 7, others keep 1..6
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
  }

  async getTodayExercises(accountId: string) {
    const userPackage = await this.prisma.userPackage.findFirst({
      where: {
        accountId,
        status: UserPackageStatus.ACTIVE,
      },
      select: {
        id: true,
        programId: true,
        startAt: true,
        endAt: true,
        expiredAt: true,
      },
      orderBy: {
        activatedAt: 'desc',
      },
    });

    if (!userPackage) {
      throw new NotFoundException('Active user package not found');
    }

    const now = new Date();
    const endAt = userPackage.endAt ?? userPackage.expiredAt ?? undefined;
    if (endAt && now > endAt) {
      throw new BadRequestException('User package has expired');
    }

    if (!userPackage.programId) {
      throw new BadRequestException(
        'This user package has no program assigned',
      );
    }

    const dayOfWeek = this.getProgramDayOfWeekToday();

    const programDay = await this.prisma.programDay.findUnique({
      where: {
        programId_dayOfWeek: {
          programId: userPackage.programId,
          dayOfWeek,
        },
      },
      include: {
        exercises: {
          orderBy: { sortOrder: 'asc' },
          include: {
            exercise: true,
          },
        },
      },
    });

    if (!programDay) {
      return {
        message: 'No workout scheduled for today',
        data: {
          dayOfWeek,
          programDay: null,
          exercises: [],
        },
      };
    }

    return {
      message: 'Get today exercises successfully',
      data: {
        dayOfWeek,
        programDay: {
          id: programDay.id,
          programId: programDay.programId,
          dayOfWeek: programDay.dayOfWeek,
          title: programDay.title,
          note: programDay.note,
        },
        exercises: programDay.exercises.map((pde) => ({
          id: pde.id,
          sortOrder: pde.sortOrder,
          exercise: pde.exercise,
        })),
      },
    };
  }

  async createWorkoutHistory(
    accountId: string,
    createWorkoutHistoryDto: CreateWorkoutHistoryDto,
  ) {
    const { userPackageId, programDayId, workoutAt, status, note } =
      createWorkoutHistoryDto;

    const userPackage = await this.prisma.userPackage.findFirst({
      where: {
        id: userPackageId,
        accountId,
        status: UserPackageStatus.ACTIVE,
      },
      select: {
        id: true,
        programId: true,
        startAt: true,
        endAt: true,
        expiredAt: true,
      },
    });

    if (!userPackage) {
      throw new NotFoundException('Active user package not found');
    }

    if (!userPackage.programId) {
      throw new BadRequestException(
        'This user package has no program assigned',
      );
    }

    const programDay = await this.prisma.programDay.findFirst({
      where: {
        id: programDayId,
        programId: userPackage.programId,
      },
      select: { id: true, programId: true, dayOfWeek: true, title: true },
    });

    if (!programDay) {
      throw new NotFoundException(
        'Program day not found or does not belong to the package program',
      );
    }

    const workoutDate = workoutAt ? new Date(workoutAt) : new Date();
    if (Number.isNaN(workoutDate.getTime())) {
      throw new BadRequestException('Invalid workoutAt');
    }

    const endAt = userPackage.endAt ?? userPackage.expiredAt ?? undefined;
    if (endAt && workoutDate > endAt) {
      throw new BadRequestException('Workout time is outside package validity');
    }

    if (userPackage.startAt && workoutDate < userPackage.startAt) {
      throw new BadRequestException(
        'Workout time is before package start time',
      );
    }

    const created = await this.prisma.workoutHistory.create({
      data: {
        accountId,
        userPackageId: userPackage.id,
        programId: userPackage.programId,
        programDayId: programDay.id,
        workoutAt: workoutDate,
        status: status ?? WorkoutHistoryStatus.COMPLETED,
        note,
      },
      include: {
        program: {
          select: { id: true, name: true, level: true },
        },
        programDay: {
          select: { id: true, dayOfWeek: true, title: true },
        },
      },
    });

    return {
      message: 'Create workout history successfully',
      data: created,
    };
  }

  async getWorkoutHistory(accountId: string, filter?: FilterWorkoutHistoryDto) {
    const { from, to } = filter ?? {};

    const where: {
      accountId: string;
      workoutAt?: { gte?: Date; lte?: Date };
    } = { accountId };

    if (from || to) {
      where.workoutAt = {};
      if (from) {
        where.workoutAt.gte = new Date(`${from}T00:00:00.000Z`);
      }
      if (to) {
        where.workoutAt.lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    const items = await this.prisma.workoutHistory.findMany({
      where,
      orderBy: { workoutAt: 'desc' },
      include: {
        userPackage: {
          select: {
            id: true,
            package: {
              select: { id: true, name: true, hasPt: true },
            },
          },
        },
        program: {
          select: { id: true, name: true, level: true },
        },
        programDay: {
          select: { id: true, dayOfWeek: true, title: true, note: true },
        },
      },
    });

    return {
      message: 'Get workout history successfully',
      data: items,
    };
  }

  async purchasePackage(
    accountId: string,
    purchasePackageDto: PurchasePackageDto,
  ) {
    const { packageId, branchId } = purchasePackageDto;

    const newPackage = await this.prisma.package.findUnique({
      where: {
        id: packageId,
      },
    });
    if (!newPackage) {
      throw new NotFoundException('Package not found');
    }

    const selectedBranch = await this.prisma.branch.findUnique({
      where: {
        id: branchId,
        isActive: true,
      },
    });
    if (!selectedBranch) {
      throw new NotFoundException('Branch not found');
    }

    if (
      newPackage.hasPt &&
      (newPackage.ptSessionsIncluded == null ||
        !Number.isFinite(newPackage.ptSessionsIncluded) ||
        newPackage.ptSessionsIncluded < 1)
    ) {
      throw new BadRequestException(
        'This PT package does not define a valid ptSessionsIncluded count',
      );
    }

    const startAt = new Date();
    const endAt = calcEndAt(startAt, newPackage.unit, newPackage.durationValue);
    const created = await this.prisma.userPackage.create({
      data: {
        accountId,
        branchId,
        packageId,
        status: UserPackageStatus.ACTIVE,
        activatedAt: startAt,
        startAt,
        endAt,
        expiredAt: endAt,
        ...(newPackage.hasPt && newPackage.ptSessionsIncluded != null
          ? { ptSessionsGranted: newPackage.ptSessionsIncluded }
          : {}),
      },
    });

    const userPackage = await this.prisma.userPackage.findUnique({
      where: { id: created.id },
      include: { package: true },
    });
    if (!userPackage) {
      throw new NotFoundException('User package not found after purchase');
    }

    const [withStats] = await this.enrichUserPackagesPtStats([userPackage]);

    return {
      message: 'Purchase package successfully',
      data: withStats,
    };
  }

  async getUserPackages(accountId: string) {
    const userPackages = await this.prisma.userPackage.findMany({
      where: {
        accountId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            unit: true,
            durationValue: true,
            hasPt: true,
            ptSessionsIncluded: true,
            price: true,
            description: true,
          },
        },
        ptAccount: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const data = await this.enrichUserPackagesPtStats(userPackages);

    return {
      message: 'Get user packages successfully',
      data,
    };
  }
  async getUserDetailPackage(accountId: string, userPackageId: string) {
    const userPackage = await this.prisma.userPackage.findUnique({
      where: {
        id: userPackageId,
        accountId,
      },
      include: {
        package: true,
        branch: true,
        ptAccount: true,
      },
    });
    if (!userPackage) {
      throw new NotFoundException('User package not found');
    }
    const [data] = await this.enrichUserPackagesPtStats([userPackage]);
    return {
      message: 'Get user detail package successfully',
      data,
    };
  }

  async checkinPackage(
    accountId: string,
    checkinPackageDto: CheckinPackageDto,
  ) {
    const { userPackageId, branchId } = checkinPackageDto;

    const userPackage = await this.prisma.userPackage.findUnique({
      where: {
        id: userPackageId,
        accountId,
        branchId,
        status: UserPackageStatus.ACTIVE,
      },
    });
    if (!userPackage) {
      throw new NotFoundException('User package not found');
    }

    const now = new Date();
    if (userPackage.expiredAt && now > userPackage.expiredAt) {
      throw new BadRequestException('User package has expired');
    }

    const checkin = await this.prisma.checkIn.create({
      data: {
        accountId,
        userPackageId,
        branchId,
        checkedInAt: now,
      },
    });
    return {
      message: 'Checkin package successfully',
      data: checkin,
    };
  }

  async getPtTrainingHistory(
    accountId: string,
    filter?: FilterPtTrainingHistoryDto,
  ) {
    const { from, to } = filter ?? {};

    const where: {
      accountId: string;
      startTime?: { gte?: Date; lte?: Date };
    } = { accountId };

    if (from || to) {
      where.startTime = {};
      if (from) {
        where.startTime.gte = new Date(`${from}T00:00:00.000Z`);
      }
      if (to) {
        where.startTime.lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    const items = await this.prisma.ptAssistRequest.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        branch: {
          select: { id: true, name: true, address: true },
        },
        ptAccount: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        userPackage: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                hasPt: true,
                ptSessionsIncluded: true,
              },
            },
          },
        },
        sessionReport: true,
      },
    });

    return {
      message: 'Get PT training history successfully',
      data: items,
    };
  }

  async getCheckins(accountId: string) {
    const checkins = await this.prisma.checkIn.findMany({
      where: {
        accountId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    });

    return {
      message: 'Get checkins successfully',
      data: checkins,
    };
  }

  async getCheckinsGrouped(accountId: string, from?: string, to?: string) {
    const tz = 'Asia/Ho_Chi_Minh';

    const where: any = { accountId };

    if (from || to) {
      where.checkedInAt = {};
      if (from) where.checkedInAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.checkedInAt.lte = new Date(`${to}T23:59:59.999Z`);
    }

    const checkins = await this.prisma.checkIn.findMany({
      where,
      select: {
        id: true,
        userPackageId: true,
        checkedInAt: true,
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    const grouped: Record<
      string,
      Array<{
        id: string;
        userPackageId: string;
        checkedInAt: Date;
        branch: { id: string; name: string };
      }>
    > = {};

    for (const c of checkins) {
      const dayKey = formatInTimeZone(c.checkedInAt, tz, 'yyyy-MM-dd');
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(c);
    }

    return {
      message: 'Get checkins successfully',
      data: grouped,
    };
  }

  async createRequestPT(accountId: string, dto: CreatePtAssistRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const userPackage = await tx.userPackage.findUnique({
        where: { id: dto.userPackageId },
        include: { package: true },
      });

      if (!userPackage) {
        throw new NotFoundException('UserPackage not found');
      }
      if (userPackage.accountId !== accountId) {
        throw new ForbiddenException('Not your package');
      }

      if (userPackage.status !== UserPackageStatus.ACTIVE) {
        throw new BadRequestException('UserPackage is not ACTIVE');
      }
      if (!userPackage.startAt || !userPackage.endAt) {
        throw new BadRequestException('UserPackage has no valid time range');
      }

      const now = new Date();
      if (now < userPackage.startAt || now > userPackage.endAt) {
        throw new BadRequestException(
          'UserPackage is expired or not started yet',
        );
      }

      if (!userPackage.package.hasPt) {
        throw new BadRequestException('This package does not include PT');
      }

      const quotaCap = this.ptQuotaCap(
        userPackage.ptSessionsGranted,
        userPackage.package,
      );
      if (quotaCap == null) {
        throw new BadRequestException(
          'Package PT session quota is not configured',
        );
      }

      const consumed = await tx.ptAssistRequest.count({
        where: {
          userPackageId: userPackage.id,
          status: {
            in: [PtAssistRequestStatus.PENDING, PtAssistRequestStatus.ACCEPTED],
          },
        },
      });
      if (consumed >= quotaCap) {
        throw new BadRequestException(
          'No PT sessions remaining for this package',
        );
      }

      const weeklySlot = await tx.ptWeeklySlot.findUnique({
        where: { id: dto.slotId },
        include: { window: true },
      });
      if (!weeklySlot) {
        throw new NotFoundException('PT weekly availability slot not found');
      }

      const win = weeklySlot.window;
      if (!win.isActive) {
        throw new BadRequestException('PT availability window is inactive');
      }
      if (!weeklySlot.isAvailable) {
        throw new BadRequestException('This PT slot is not available');
      }

      const slotPt = await tx.account.findFirst({
        where: {
          id: win.ptAccountId,
          role: Role.PT,
          status: AccountStatus.ACTIVE,
        },
        select: { id: true },
      });
      if (!slotPt) {
        throw new BadRequestException(
          'This availability is not linked to an active PT',
        );
      }
      if (win.branchId !== userPackage.branchId) {
        throw new BadRequestException(
          'Selected slot does not belong to your package branch',
        );
      }

      const sessionDow = isoDowMon1Sun7ForCalendarDate(dto.sessionDate);
      if (sessionDow !== weeklySlot.dayOfWeek) {
        throw new BadRequestException(
          'sessionDate weekday does not match this weekly slot',
        );
      }

      if (
        !calendarDateOverlapsWindow(dto.sessionDate, win.fromDate, win.toDate)
      ) {
        throw new BadRequestException(
          'Requested date is outside PT availability window',
        );
      }

      let requestedStart: Date;
      let requestedEnd: Date;
      try {
        const bounds = utcBoundsForCalendarSlot(
          dto.sessionDate,
          weeklySlot.startTime,
          weeklySlot.endTime,
        );
        requestedStart = bounds.start;
        requestedEnd = bounds.end;
      } catch {
        throw new BadRequestException('Invalid session times for slot');
      }
      if (requestedEnd <= requestedStart) {
        throw new BadRequestException('Invalid slot time range');
      }

      if (
        requestedStart < userPackage.startAt ||
        requestedStart > userPackage.endAt
      ) {
        throw new BadRequestException(
          'Requested time is outside package validity',
        );
      }

      const taken = await tx.ptAssistRequest.count({
        where: {
          ptAccountId: win.ptAccountId,
          branchId: win.branchId,
          startTime: requestedStart,
          endTime: requestedEnd,
          status: {
            in: [PtAssistRequestStatus.PENDING, PtAssistRequestStatus.ACCEPTED],
          },
        },
      });
      if (taken >= 1) {
        throw new BadRequestException('This time slot is already booked');
      }

      const dupPending = await tx.ptAssistRequest.findFirst({
        where: {
          accountId,
          ptAccountId: win.ptAccountId,
          status: PtAssistRequestStatus.PENDING,
          startTime: requestedStart,
          endTime: requestedEnd,
        },
        select: { id: true },
      });

      if (dupPending) {
        throw new BadRequestException(
          'You already have a pending request in this time slot',
        );
      }

      const created = await tx.ptAssistRequest.create({
        data: {
          accountId,
          userPackageId: userPackage.id,
          branchId: win.branchId,
          ptAccountId: win.ptAccountId,
          startTime: requestedStart,
          endTime: requestedEnd,
          note: dto.note,
          status: PtAssistRequestStatus.PENDING,
        },
        include: {
          branch: { select: { id: true, name: true } },
          ptAccount: { select: { id: true, email: true } },
        },
      });

      return {
        message: 'Create PT assist request successfully',
        data: created,
      };
    });
  }
}
