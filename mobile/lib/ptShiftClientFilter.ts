import type { AvailablePtAccount, PtWeeklySlotItem } from "@/types/types";

/** Lọc client theo buổi (khớp tinh thần lưới: sáng <12h, trưa 12–17h, tối ≥17h). */
export type PtShiftBuoiFilter = "all" | "morning" | "noon" | "evening";

function parseYmdStart(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startMinutes(hhmm: string): number {
  const parts = hhmm.trim().split(":");
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

function slotMatchesBuoi(
  slot: Pick<PtWeeklySlotItem, "startTime">,
  buoi: Exclude<PtShiftBuoiFilter, "all">,
): boolean {
  const sm = startMinutes(slot.startTime);
  const M = 60;
  if (buoi === "morning") return sm >= 6 * M && sm < 12 * M;
  if (buoi === "noon") return sm >= 12 * M && sm < 17 * M;
  return sm >= 17 * M && sm < 22 * M;
}

function windowOverlapsUserRange(
  win: { fromDate: string; toDate: string },
  fromYmd: string,
  toYmd: string,
): boolean {
  const wStart = parseYmdStart(win.fromDate);
  const wEnd = parseYmdStart(win.toDate);
  const uStart = parseYmdStart(fromYmd);
  const uEnd = parseYmdStart(toYmd);
  return wEnd >= uStart && wStart <= uEnd;
}

function ptHasBuoi(
  pt: AvailablePtAccount,
  buoi: Exclude<PtShiftBuoiFilter, "all">,
  range?: { from?: string; to?: string },
): boolean {
  const windows = pt.ptAvailabilityWindows ?? [];
  const useRange = Boolean(range?.from && range?.to);

  for (const win of windows) {
    if (useRange && range?.from && range?.to) {
      if (!windowOverlapsUserRange(win, range.from, range.to)) continue;
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
  if (buoi === "all") return pts;
  return pts.filter((pt) => ptHasBuoi(pt, buoi, range));
}
