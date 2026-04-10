import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  PtAssistRequestStatus,
  Role,
  ShiftType,
  UserPackageStatus,
} from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PT_BOOKING_GRID_SLOTS,
  type PtGridSlotDef,
} from 'src/pt-schedule/grid-slots.constants';
import {
  findGridSlotDef,
  getGridSlotDefsForShift,
  normalizeHhMm,
  PT_TIMEZONE,
} from 'src/pt-schedule/pt-schedule.helpers';
import { fromZonedTime } from 'date-fns-tz';
import { calcEndAt } from 'src/utils/helpers';
import { CreatePtSessionReportDto } from './dto/create-pt-session-report.dto';
import { CreatePtTrainingSlotDto } from './dto/create-pt-training-slot.dto';
import { FilterPtTrainingSlotsDto } from './dto/filter-pt-training-slots.dto';
import { RejectPtAssistRequestDto } from './dto/reject-pt-assist-request.dto';

@Injectable()
export class PersonalTrainerService {
  constructor(private readonly prisma: PrismaService) {}

  getBookingSlotGridDefinition() {
    return {
      message: 'Booking slot grid rows (fixed; VN local time labels)',
      data: {
        timeZone: PT_TIMEZONE,
        dayOfWeekLegend: '1 = Monday … 7 = Sunday (ISO)',
        slots: PT_BOOKING_GRID_SLOTS.map((row) => ({
          key: row.key,
          startTime: row.startTime,
          endTime: row.endTime,
          shiftType: row.shiftType,
        })),
      },
    };
  }

  async getPtAssistRequests(ptAccountId: string) {
    const requests = await this.prisma.ptAssistRequest.findMany({
      where: { ptAccountId, status: PtAssistRequestStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: {
          select: { id: true, name: true, address: true },
        },
        userPackage: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                hasPt: true,
                unit: true,
                durationValue: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Get PT assist requests successfully',
      data: requests,
    };
  }

  async acceptPtAssistRequest(ptAccountId: string, requestId: string) {
    const found = await this.prisma.ptAssistRequest.findFirst({
      where: {
        id: requestId,
        ptAccountId,
        status: PtAssistRequestStatus.PENDING,
      },
    });
    if (!found) {
      throw new NotFoundException(
        'PT assist request not found or not in PENDING status',
      );
    }

    const updated = await this.prisma.ptAssistRequest.update({
      where: { id: requestId },
      data: { status: PtAssistRequestStatus.ACCEPTED },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: { select: { id: true, name: true, address: true } },
        userPackage: {
          include: {
            package: {
              select: { id: true, name: true, hasPt: true },
            },
          },
        },
      },
    });

    return {
      message: 'Accept PT assist request successfully',
      data: updated,
    };
  }

  async rejectPtAssistRequest(
    ptAccountId: string,
    requestId: string,
    dto: RejectPtAssistRequestDto,
  ) {
    const found = await this.prisma.ptAssistRequest.findFirst({
      where: {
        id: requestId,
        ptAccountId,
        status: PtAssistRequestStatus.PENDING,
      },
    });
    if (!found) {
      throw new NotFoundException(
        'PT assist request not found or not in PENDING status',
      );
    }

    const updated = await this.prisma.ptAssistRequest.update({
      where: { id: requestId },
      data: {
        status: PtAssistRequestStatus.REJECTED,
        ...(dto.rejectReason !== undefined
          ? { rejectReason: dto.rejectReason }
          : {}),
      },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: { select: { id: true, name: true, address: true } },
        userPackage: {
          include: {
            package: {
              select: { id: true, name: true, hasPt: true },
            },
          },
        },
      },
    });

    return {
      message: 'Reject PT assist request successfully',
      data: updated,
    };
  }

  async getRequestedPackages(ptAccountId: string) {
    const pendingAssist = await this.prisma.ptAssistRequest.findMany({
      where: {
        ptAccountId,
        status: PtAssistRequestStatus.PENDING,
      },
      select: { userPackageId: true },
      distinct: ['userPackageId'],
    });
    const ids = pendingAssist.map((r) => r.userPackageId);
    const listRequestedPackages = await this.prisma.userPackage.findMany({
      where: { id: { in: ids } },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            hasPt: true,
            ptSessionsIncluded: true,
          },
        },
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return {
      message:
        'User packages with at least one pending PT session request to you',
      data: listRequestedPackages,
    };
  }

  async getAcceptedPackages(ptAccountId: string) {
    const assistRows = await this.prisma.ptAssistRequest.findMany({
      where: {
        ptAccountId,
        status: PtAssistRequestStatus.ACCEPTED,
      },
      select: { userPackageId: true },
      distinct: ['userPackageId'],
    });
    const ids = assistRows.map((r) => r.userPackageId);
    const listAcceptedPackages = await this.prisma.userPackage.findMany({
      where: {
        id: { in: ids },
        status: UserPackageStatus.ACTIVE,
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            hasPt: true,
            ptSessionsIncluded: true,
          },
        },
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return {
      message:
        'Active user packages where you have accepted at least one PT session',
      data: listAcceptedPackages,
    };
  }

  /** @deprecated Legacy flow: user chose PT at purchase; kept for old PENDING rows only */
  async acceptedRequest(ptAccountId: string, userPackageId: string) {
    const requestedPackage = await this.prisma.userPackage.findUnique({
      where: {
        id: userPackageId,
        ptAccountId: ptAccountId,
        status: UserPackageStatus.PENDING,
      },
      include: {
        package: true,
      },
    });
    if (!requestedPackage) {
      throw new NotFoundException('Requested package not found');
    }
    const now = new Date();
    const endAt = calcEndAt(
      now,
      requestedPackage.package.unit,
      requestedPackage.package.durationValue,
    );
    const updatedRequestedPackage = await this.prisma.userPackage.update({
      where: { id: userPackageId },
      data: {
        status: UserPackageStatus.ACTIVE,
        startAt: now,
        endAt: endAt,
        activatedAt: now,
        expiredAt: endAt,
      },
    });
    return {
      message: 'Accepted request successfully',
      data: updatedRequestedPackage,
    };
  }

  /** @deprecated Legacy flow: rejects package assignment at purchase time */
  async rejectedRequest(ptAccountId: string, userPackageId: string) {
    const requestedPackage = await this.prisma.userPackage.update({
      where: {
        id: userPackageId,
        ptAccountId: ptAccountId,
        status: UserPackageStatus.PENDING,
      },
      data: { status: UserPackageStatus.REJECTED },
    });
    return {
      message: 'Rejected request successfully',
      data: requestedPackage,
    };
  }

  async getAssistPtSchedule(ptAccountId: string, from?: string, to?: string) {
    const where: {
      ptAccountId: string;
      status: PtAssistRequestStatus;
      startTime?: { gte?: Date; lte?: Date };
    } = {
      ptAccountId,
      status: PtAssistRequestStatus.ACCEPTED,
    };

    if (from || to) {
      where.startTime = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
          throw new BadRequestException('Invalid from date');
        }
        where.startTime.gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
          throw new BadRequestException('Invalid to date');
        }
        where.startTime.lte = toDate;
      }
    }

    const requests = await this.prisma.ptAssistRequest.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: {
          select: { id: true, name: true, address: true },
        },
        userPackage: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                hasPt: true,
              },
            },
          },
        },
      },
    });

    const events = requests.map((r) => ({
      id: r.id,
      title: `${r.account.profile?.name || r.account.email} - ${r.branch.name}`,
      start: r.startTime.toISOString(),
      end: r.endTime.toISOString(),
      allDay: false,
      extendedProps: {
        status: r.status,
        note: r.note,
        rejectReason: r.rejectReason,
        account: r.account,
        branch: r.branch,
        userPackage: r.userPackage,
      },
    }));

    return {
      message: 'Get PT assist schedule successfully',
      data: events,
    };
  }

  async assignProgramToUser(userPackageId: string, programId: string) {
    const userPackage = await this.prisma.userPackage.findUnique({
      where: {
        id: userPackageId,
        status: UserPackageStatus.ACTIVE,
      },
    });
    if (!userPackage) {
      throw new NotFoundException('User package is invalid or not ACTIVE');
    }

    const updatedUserPackage = await this.prisma.userPackage.update({
      where: { id: userPackageId },
      data: { programId },
    });
    return {
      message: 'Assign program to user successfully',
      data: updatedUserPackage,
    };
  }

  async upsertSessionReport(
    ptAccountId: string,
    dto: CreatePtSessionReportDto,
  ) {
    const assist = await this.prisma.ptAssistRequest.findFirst({
      where: {
        id: dto.ptAssistRequestId,
        ptAccountId,
        status: PtAssistRequestStatus.ACCEPTED,
      },
    });

    if (!assist) {
      throw new NotFoundException(
        'PT assist request not found, not accepted, or not assigned to you',
      );
    }

    const {
      completion,
      summary,
      techniqueNote,
      improvement,
      nextSessionPlan,
      weightKg,
      bodyNote,
    } = dto;

    const report = await this.prisma.ptSessionReport.upsert({
      where: { ptAssistRequestId: assist.id },
      create: {
        ptAssistRequestId: assist.id,
        ptAccountId,
        accountId: assist.accountId,
        completion,
        summary,
        techniqueNote,
        improvement,
        nextSessionPlan,
        weightKg,
        bodyNote,
      },
      update: {
        completion,
        summary,
        techniqueNote,
        improvement,
        nextSessionPlan,
        weightKg,
        bodyNote,
      },
      include: {
        ptAssistRequest: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
      },
    });

    return {
      message: 'Save PT session report successfully',
      data: report,
    };
  }

  async createPtTrainingSlot(
    ptAccountId: string,
    dto: CreatePtTrainingSlotDto,
  ) {
    const pt = await this.prisma.account.findFirst({
      where: {
        id: ptAccountId,
        role: Role.PT,
        status: AccountStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (!pt) {
      throw new NotFoundException('PT account not found or inactive');
    }

    const fromUtc = fromZonedTime(`${dto.fromDate}T00:00:00`, PT_TIMEZONE);
    const toUtc = fromZonedTime(`${dto.toDate}T23:59:59.999`, PT_TIMEZONE);
    if (Number.isNaN(fromUtc.getTime()) || Number.isNaN(toUtc.getTime())) {
      throw new BadRequestException('Invalid fromDate or toDate');
    }
    if (toUtc < fromUtc) {
      throw new BadRequestException(
        'toDate must be greater than or equal fromDate',
      );
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, isActive: true },
      select: { id: true },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found or inactive');
    }

    const nSlots = dto.slots?.length ?? 0;
    const nShift = dto.shiftSelections?.length ?? 0;
    if (nSlots < 1 && nShift < 1) {
      throw new BadRequestException(
        'Provide at least one slot in slots and/or at least one shiftSelections entry',
      );
    }

    const overlap = await this.prisma.ptAvailabilityWindow.findFirst({
      where: {
        ptAccountId,
        branchId: dto.branchId,
        isActive: true,
        fromDate: { lte: toUtc },
        toDate: { gte: fromUtc },
      },
      select: { id: true },
    });
    if (overlap) {
      throw new BadRequestException(
        'You already have an active availability window overlapping this date range for this branch',
      );
    }

    const seen = new Set<string>();
    const weeklyCreates: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      shiftType: ShiftType;
    }> = [];

    const addWeeklyFromGridDef = (dayOfWeek: number, def: PtGridSlotDef) => {
      const start = normalizeHhMm(def.startTime);
      const end = normalizeHhMm(def.endTime);
      const key = `${dayOfWeek}|${start}|${end}`;
      if (seen.has(key)) {
        throw new BadRequestException(`Duplicate slot in payload: ${key}`);
      }
      seen.add(key);
      weeklyCreates.push({
        dayOfWeek,
        startTime: start,
        endTime: end,
        isAvailable: true,
        shiftType: def.shiftType,
      });
    };

    for (const s of dto.slots ?? []) {
      const def = findGridSlotDef(s.startTime, s.endTime);
      if (!def) {
        throw new BadRequestException(
          `Unknown grid slot ${s.startTime}-${s.endTime}; use GET /pt/booking-slot-grid-definition`,
        );
      }
      addWeeklyFromGridDef(s.dayOfWeek, def);
    }

    for (const sel of dto.shiftSelections ?? []) {
      const defs = getGridSlotDefsForShift(sel.shiftType);
      if (defs.length === 0) {
        throw new BadRequestException(
          `No grid rows for shift ${sel.shiftType}; use GET /pt/booking-slot-grid-definition`,
        );
      }
      const uniqueDays = [...new Set(sel.dayOfWeeks)];
      for (const d of uniqueDays) {
        for (const def of defs) {
          addWeeklyFromGridDef(d, def);
        }
      }
    }

    if (weeklyCreates.length === 0) {
      throw new BadRequestException(
        'No weekly slots to create; add slots and/or shiftSelections',
      );
    }

    const window = await this.prisma.ptAvailabilityWindow.create({
      data: {
        ptAccountId,
        branchId: dto.branchId,
        fromDate: fromUtc,
        toDate: toUtc,
        weeklySlots: { create: weeklyCreates },
      },
      include: {
        branch: { select: { id: true, name: true, address: true } },
        weeklySlots: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    return {
      message: 'Create availability window successfully',
      data: window,
    };
  }

  async getPtTrainingSlots(
    ptAccountId: string,
    filter?: FilterPtTrainingSlotsDto,
  ) {
    const { from, to } = filter ?? {};

    const where: {
      ptAccountId: string;
      fromDate?: { lte?: Date };
      toDate?: { gte?: Date };
    } = { ptAccountId };

    if (from) {
      where.toDate = {
        gte: fromZonedTime(`${from}T00:00:00`, PT_TIMEZONE),
      };
    }
    if (to) {
      where.fromDate = {
        lte: fromZonedTime(`${to}T23:59:59.999`, PT_TIMEZONE),
      };
    }

    const windows = await this.prisma.ptAvailabilityWindow.findMany({
      where,
      orderBy: { fromDate: 'asc' },
      include: {
        branch: { select: { id: true, name: true, address: true } },
        weeklySlots: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    return {
      message: 'Get availability windows successfully',
      data: windows,
    };
  }
}
