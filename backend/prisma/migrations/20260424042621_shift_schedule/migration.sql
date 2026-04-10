/*
  Warnings:

  - You are about to drop the `PtTrainingSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- DropForeignKey
ALTER TABLE "PtTrainingSlot" DROP CONSTRAINT "PtTrainingSlot_branchId_fkey";

-- DropForeignKey
ALTER TABLE "PtTrainingSlot" DROP CONSTRAINT "PtTrainingSlot_ptAccountId_fkey";

-- DropTable
DROP TABLE "PtTrainingSlot";

-- CreateTable
CREATE TABLE "PtShiftTemplate" (
    "id" TEXT NOT NULL,
    "type" "ShiftType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PtShiftSchedule" (
    "id" TEXT NOT NULL,
    "ptAccountId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtShiftSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PtShiftTemplate_type_key" ON "PtShiftTemplate"("type");

-- CreateIndex
CREATE INDEX "PtShiftSchedule_ptAccountId_branchId_idx" ON "PtShiftSchedule"("ptAccountId", "branchId");

-- CreateIndex
CREATE INDEX "PtShiftSchedule_shiftTemplateId_idx" ON "PtShiftSchedule"("shiftTemplateId");

-- CreateIndex
CREATE INDEX "PtShiftSchedule_ptAccountId_fromDate_toDate_idx" ON "PtShiftSchedule"("ptAccountId", "fromDate", "toDate");

-- CreateIndex
CREATE INDEX "PtShiftSchedule_branchId_fromDate_toDate_idx" ON "PtShiftSchedule"("branchId", "fromDate", "toDate");

-- AddForeignKey
ALTER TABLE "PtShiftSchedule" ADD CONSTRAINT "PtShiftSchedule_ptAccountId_fkey" FOREIGN KEY ("ptAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtShiftSchedule" ADD CONSTRAINT "PtShiftSchedule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtShiftSchedule" ADD CONSTRAINT "PtShiftSchedule_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "PtShiftTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
