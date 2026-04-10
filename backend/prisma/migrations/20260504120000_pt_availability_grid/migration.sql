-- CreateTable
CREATE TABLE "PtAvailabilityWindow" (
    "id" TEXT NOT NULL,
    "ptAccountId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtAvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PtWeeklySlot" (
    "id" TEXT NOT NULL,
    "windowId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtWeeklySlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PtAvailabilityWindow_ptAccountId_branchId_idx" ON "PtAvailabilityWindow"("ptAccountId", "branchId");

-- CreateIndex
CREATE INDEX "PtAvailabilityWindow_branchId_fromDate_toDate_idx" ON "PtAvailabilityWindow"("branchId", "fromDate", "toDate");

-- CreateIndex
CREATE INDEX "PtWeeklySlot_windowId_idx" ON "PtWeeklySlot"("windowId");

-- CreateIndex
CREATE UNIQUE INDEX "PtWeeklySlot_windowId_dayOfWeek_startTime_endTime_key" ON "PtWeeklySlot"("windowId", "dayOfWeek", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "PtAvailabilityWindow" ADD CONSTRAINT "PtAvailabilityWindow_ptAccountId_fkey" FOREIGN KEY ("ptAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtAvailabilityWindow" ADD CONSTRAINT "PtAvailabilityWindow_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtWeeklySlot" ADD CONSTRAINT "PtWeeklySlot_windowId_fkey" FOREIGN KEY ("windowId") REFERENCES "PtAvailabilityWindow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy shift schedules → windows + Mon–Sun weekly slots (same clock as old template every day)
DO $$
DECLARE
  rec RECORD;
  new_window_id TEXT;
  d INT;
BEGIN
  FOR rec IN
    SELECT s."ptAccountId", s."branchId", s."fromDate", s."toDate", s."isActive",
           t."startTime", t."endTime"
    FROM "PtShiftSchedule" s
    INNER JOIN "PtShiftTemplate" t ON t."id" = s."shiftTemplateId"
  LOOP
    new_window_id := gen_random_uuid()::text;
    INSERT INTO "PtAvailabilityWindow" ("id", "ptAccountId", "branchId", "fromDate", "toDate", "isActive", "createdAt", "updatedAt")
    VALUES (new_window_id, rec."ptAccountId", rec."branchId", rec."fromDate", rec."toDate", COALESCE(rec."isActive", true), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    FOR d IN 1..7 LOOP
      INSERT INTO "PtWeeklySlot" ("id", "windowId", "dayOfWeek", "startTime", "endTime", "isAvailable", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        new_window_id,
        d,
        rec."startTime",
        rec."endTime",
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    END LOOP;
  END LOOP;
END $$;

-- DropForeignKey
ALTER TABLE "PtShiftSchedule" DROP CONSTRAINT "PtShiftSchedule_ptAccountId_fkey";

ALTER TABLE "PtShiftSchedule" DROP CONSTRAINT "PtShiftSchedule_branchId_fkey";

ALTER TABLE "PtShiftSchedule" DROP CONSTRAINT "PtShiftSchedule_shiftTemplateId_fkey";

-- DropTable
DROP TABLE "PtShiftSchedule";

-- DropTable
DROP TABLE "PtShiftTemplate";

-- DropEnum
DROP TYPE "ShiftType";
