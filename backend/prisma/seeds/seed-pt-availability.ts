import 'dotenv/config';
import { addMonths } from 'date-fns';
import { PrismaPg } from '@prisma/adapter-pg';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { PrismaClient } from '../../generated/prisma/client';
import { AccountStatus, Role, ShiftType } from '../../generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const TZ = 'Asia/Ho_Chi_Minh';

/**
 * Seed one demo availability window (Mon–Sat afternoons) for first PT × first branch.
 * Replaces the old PtShiftTemplate seed — grid rows are fixed in app code.
 */
export async function seedPtAvailability() {
  const branch = await prisma.branch.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  const pt = await prisma.account.findFirst({
    where: { role: Role.PT, status: AccountStatus.ACTIVE },
    orderBy: { createdAt: 'asc' },
  });

  if (!branch || !pt) {
    console.log('Skipping PT availability seed (no branch or PT).');
    return;
  }

  const todayYmd = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
  const endAnchor = formatInTimeZone(addMonths(new Date(), 2), TZ, 'yyyy-MM-dd');

  const fromUtc = fromZonedTime(`${todayYmd}T00:00:00`, TZ);
  const toUtc = fromZonedTime(`${endAnchor}T23:59:59.999`, TZ);

  const existing = await prisma.ptAvailabilityWindow.findFirst({
    where: {
      ptAccountId: pt.id,
      branchId: branch.id,
      isActive: true,
      fromDate: { lte: toUtc },
      toDate: { gte: fromUtc },
    },
  });
  if (existing) {
    console.log('PT availability overlap exists; skipping seed.');
    return;
  }

  const days = [1, 2, 3, 4, 5, 6];
  const slots = days.flatMap((dayOfWeek) => [
    {
      dayOfWeek,
      startTime: '15:00',
      endTime: '17:00',
      shiftType: ShiftType.AFTERNOON,
    },
    {
      dayOfWeek,
      startTime: '17:00',
      endTime: '19:00',
      shiftType: ShiftType.EVENING,
    },
  ]);

  await prisma.ptAvailabilityWindow.create({
    data: {
      ptAccountId: pt.id,
      branchId: branch.id,
      fromDate: fromUtc,
      toDate: toUtc,
      weeklySlots: { create: slots },
    },
  });

  console.log(
    `Seeded PT availability for ${pt.email} @ ${branch.name} (${todayYmd} → ${endAnchor})`,
  );
}
