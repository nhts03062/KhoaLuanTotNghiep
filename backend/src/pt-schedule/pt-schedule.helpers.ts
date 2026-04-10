import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { ShiftType } from 'generated/prisma/enums';
import {
  PT_BOOKING_GRID_SLOTS,
  PtGridSlotDef,
} from './grid-slots.constants';

export const PT_TIMEZONE = 'Asia/Ho_Chi_Minh';

export function normalizeHhMm(time: string): string {
  const [rawH = '0', rawM = '0'] = time.trim().split(':');
  const h = Number(rawH);
  const m = Number(rawM);
  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return '';
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function findGridSlotDef(
  startTime: string,
  endTime: string,
): PtGridSlotDef | undefined {
  const s = normalizeHhMm(startTime);
  const e = normalizeHhMm(endTime);
  return PT_BOOKING_GRID_SLOTS.find(
    (slot) =>
      normalizeHhMm(slot.startTime) === s && normalizeHhMm(slot.endTime) === e,
  );
}

/** All official grid rows that belong to this shift (for PT shiftSelections). */
export function getGridSlotDefsForShift(
  shiftType: ShiftType,
): PtGridSlotDef[] {
  return PT_BOOKING_GRID_SLOTS.filter((row) => row.shiftType === shiftType);
}

export function utcBoundsForCalendarSlot(
  calendarDateYmd: string,
  startHHmm: string,
  endHHmm: string,
): { start: Date; end: Date } {
  const s =
    /^(\d{1,2}):(\d{2})$/.exec(startHHmm.trim()) ??
    /^(\d{2}):(\d{2}):(\d{2})$/.exec(startHHmm.trim());
  const eSlot =
    /^(\d{1,2}):(\d{2})$/.exec(endHHmm.trim()) ??
    /^(\d{2}):(\d{2}):(\d{2})$/.exec(endHHmm.trim());
  if (!s || !eSlot) {
    throw new RangeError('Invalid time format');
  }
  const sh = Number(s[1]);
  const sm = Number(s[2]);
  const eh = Number(eSlot[1]);
  const em = Number(eSlot[2]);

  const startStr = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00`;
  const endStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;

  const start = fromZonedTime(
    `${calendarDateYmd}T${startStr}`,
    PT_TIMEZONE,
  );
  const end = fromZonedTime(`${calendarDateYmd}T${endStr}`, PT_TIMEZONE);
  return { start, end };
}

/** ISO weekday at noon local VN on this calendar date: 1 = Mon … 7 = Sun */
export function isoDowMon1Sun7ForCalendarDate(
  calendarDateYmd: string,
): number {
  const anchor = fromZonedTime(`${calendarDateYmd}T12:00:00`, PT_TIMEZONE);
  return Number(formatInTimeZone(anchor, PT_TIMEZONE, 'i'));
}

export function enumerateWeekDatesFromMonday(
  weekMondayYmd: string,
): string[] {
  const mon = fromZonedTime(`${weekMondayYmd}T12:00:00`, PT_TIMEZONE);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const instant = addDays(mon, i);
    out.push(formatInTimeZone(instant, PT_TIMEZONE, 'yyyy-MM-dd'));
  }
  return out;
}

/** True if calendarDate falls within [windowFrom, windowTo] on the same inclusive calendar semantics (VN). */
export function calendarDateOverlapsWindow(
  calendarDateYmd: string,
  windowFrom: Date,
  windowTo: Date,
): boolean {
  const d = calendarDateYmd;
  const fromYmd = formatInTimeZone(windowFrom, PT_TIMEZONE, 'yyyy-MM-dd');
  const toYmd = formatInTimeZone(windowTo, PT_TIMEZONE, 'yyyy-MM-dd');
  return d >= fromYmd && d <= toYmd;
}
