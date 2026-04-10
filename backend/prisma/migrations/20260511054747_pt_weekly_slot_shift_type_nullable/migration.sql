-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- AlterTable
ALTER TABLE "PtWeeklySlot" ADD COLUMN     "shiftType" "ShiftType";
