import dayjs from 'dayjs';
import type { AvailablePtAccount, PtWeeklySlotItem } from '@/app/types/types';

/** Lọc client theo buổi (khớp tinh thần lưới: sáng &lt;12h, trưa 12–17h, tối ≥17h). */
export type PtShiftBuoiFilter = 'all' | 'morning' | 'noon' | 'evening';

function startMinutes(hhmm: string): number {
  const parts = hhmm.trim().split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

function slotMatchesBuoi(
  slot: Pick<PtWeeklySlotItem, 'startTime'>,
  buoi: Exclude<PtShiftBuoiFilter, 'all'>,
): boolean {
  const sm = startMinutes(slot.startTime);
  const M = 60;
  if (buoi === 'morning') return sm >= 6 * M && sm < 12 * M;
  if (buoi === 'noon') return sm >= 12 * M && sm < 17 * M;
  return sm >= 17 * M && sm < 22 * M;
}

function windowOverlapsUserRange(
  win: { fromDate: string; toDate: string },
  fromYmd: string,
  toYmd: string,
): boolean {
  const wStart = dayjs(win.fromDate).startOf('day');
  const wEnd = dayjs(win.toDate).startOf('day');
  const uStart = dayjs(fromYmd, 'YYYY-MM-DD').startOf('day');
  const uEnd = dayjs(toYmd, 'YYYY-MM-DD').startOf('day');
  return !wEnd.isBefore(uStart, 'day') && !wStart.isAfter(uEnd, 'day');
}

function ptHasBuoi(
  pt: AvailablePtAccount,
  buoi: Exclude<PtShiftBuoiFilter, 'all'>,
  range?: { from?: string; to?: string },
): boolean {
  const windows = pt.ptAvailabilityWindows ?? [];
  const useRange = Boolean(range?.from && range?.to);

  for (const win of windows) {
    if (useRange && range!.from && range!.to) {
      if (!windowOverlapsUserRange(win, range!.from, range!.to)) continue;
    }
    for (const slot of win.weeklySlots ?? []) {
      if (slot.isAvailable === false) continue;
      if (slotMatchesBuoi(slot, buoi)) return true;
    }
  }
  return false;
}

export function filterAvailablePtsByBuoi(
  pts: AvailablePtAccount[],
  buoi: PtShiftBuoiFilter,
  range?: { from?: string; to?: string },
): AvailablePtAccount[] {
  if (buoi === 'all') return pts;
  return pts.filter((pt) => ptHasBuoi(pt, buoi, range));
}
