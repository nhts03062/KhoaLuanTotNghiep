import { ShiftType } from 'generated/prisma/enums';

/**
 * Official booking grid rows (VN wall clock). dayOfWeek 1 = Mon … 7 = Sun (ISO).
 * `shiftType` groups rows for PT “chọn ca” expansion (POST …shiftSelections).
 */
export const PT_BOOKING_GRID_SLOTS = [
  {
    key: 'R06',
    startTime: '06:00',
    endTime: '08:00',
    shiftType: ShiftType.MORNING,
  },
  {
    key: 'R08',
    startTime: '08:00',
    endTime: '10:00',
    shiftType: ShiftType.MORNING,
  },
  {
    key: 'R10',
    startTime: '10:00',
    endTime: '12:00',
    shiftType: ShiftType.MORNING,
  },
  {
    key: 'R13',
    startTime: '13:00',
    endTime: '15:00',
    shiftType: ShiftType.AFTERNOON,
  },
  {
    key: 'R15',
    startTime: '15:00',
    endTime: '17:00',
    shiftType: ShiftType.AFTERNOON,
  },
  {
    key: 'R17',
    startTime: '17:00',
    endTime: '19:00',
    shiftType: ShiftType.EVENING,
  },
  {
    key: 'R19',
    startTime: '19:00',
    endTime: '21:00',
    shiftType: ShiftType.EVENING,
  },
  /** Carried over from deprecated 3-shift seed for migrated rows */
  {
    key: 'R0709',
    startTime: '07:00',
    endTime: '09:00',
    shiftType: ShiftType.MORNING,
  },
  {
    key: 'R1820',
    startTime: '18:00',
    endTime: '20:00',
    shiftType: ShiftType.EVENING,
  },
] as const;

export type PtGridSlotDef = (typeof PT_BOOKING_GRID_SLOTS)[number];
