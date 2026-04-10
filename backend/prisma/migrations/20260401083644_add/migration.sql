-- CreateEnum
CREATE TYPE "WorkoutHistoryStatus" AS ENUM ('COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "UserPackage" ADD COLUMN     "programId" TEXT;

-- CreateTable
CREATE TABLE "WorkoutHistory" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userPackageId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "programDayId" TEXT NOT NULL,
    "workoutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "WorkoutHistoryStatus" NOT NULL DEFAULT 'COMPLETED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutHistory_accountId_workoutAt_idx" ON "WorkoutHistory"("accountId", "workoutAt");

-- CreateIndex
CREATE INDEX "WorkoutHistory_userPackageId_workoutAt_idx" ON "WorkoutHistory"("userPackageId", "workoutAt");

-- CreateIndex
CREATE INDEX "WorkoutHistory_programId_workoutAt_idx" ON "WorkoutHistory"("programId", "workoutAt");

-- CreateIndex
CREATE INDEX "WorkoutHistory_programDayId_workoutAt_idx" ON "WorkoutHistory"("programDayId", "workoutAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutHistory_accountId_programDayId_workoutAt_key" ON "WorkoutHistory"("accountId", "programDayId", "workoutAt");

-- CreateIndex
CREATE INDEX "UserPackage_programId_idx" ON "UserPackage"("programId");

-- AddForeignKey
ALTER TABLE "UserPackage" ADD CONSTRAINT "UserPackage_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutHistory" ADD CONSTRAINT "WorkoutHistory_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutHistory" ADD CONSTRAINT "WorkoutHistory_userPackageId_fkey" FOREIGN KEY ("userPackageId") REFERENCES "UserPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutHistory" ADD CONSTRAINT "WorkoutHistory_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutHistory" ADD CONSTRAINT "WorkoutHistory_programDayId_fkey" FOREIGN KEY ("programDayId") REFERENCES "ProgramDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
