-- CreateEnum
CREATE TYPE "PtMonthlyRewardPayoutStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PtMonthlyRewardPayoutSource" AS ENUM ('AUTO', 'MANUAL_OVERRIDE');

-- CreateTable
CREATE TABLE "PtMonthlyKpiPolicy" (
    "id" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "targetTrainees" INTEGER NOT NULL,
    "targetSessions" INTEGER NOT NULL,
    "rewardAmount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtMonthlyKpiPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PtMonthlyKpiSnapshot" (
    "id" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "ptAccountId" TEXT NOT NULL,
    "distinctTrainees" INTEGER NOT NULL DEFAULT 0,
    "acceptedSessions" INTEGER NOT NULL DEFAULT 0,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmountAuto" INTEGER NOT NULL DEFAULT 0,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtMonthlyKpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PtMonthlyRewardPayout" (
    "id" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "ptAccountId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "amountAuto" INTEGER NOT NULL DEFAULT 0,
    "amountFinal" INTEGER NOT NULL DEFAULT 0,
    "status" "PtMonthlyRewardPayoutStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "PtMonthlyRewardPayoutSource" NOT NULL DEFAULT 'AUTO',
    "approvedByAdminId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtMonthlyRewardPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PtMonthlyKpiPolicy_monthKey_key" ON "PtMonthlyKpiPolicy"("monthKey");

-- CreateIndex
CREATE INDEX "PtMonthlyKpiPolicy_isActive_idx" ON "PtMonthlyKpiPolicy"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PtMonthlyKpiSnapshot_ptAccountId_monthKey_key" ON "PtMonthlyKpiSnapshot"("ptAccountId", "monthKey");

-- CreateIndex
CREATE INDEX "PtMonthlyKpiSnapshot_monthKey_idx" ON "PtMonthlyKpiSnapshot"("monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "PtMonthlyRewardPayout_snapshotId_key" ON "PtMonthlyRewardPayout"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "PtMonthlyRewardPayout_ptAccountId_monthKey_key" ON "PtMonthlyRewardPayout"("ptAccountId", "monthKey");

-- CreateIndex
CREATE INDEX "PtMonthlyRewardPayout_monthKey_idx" ON "PtMonthlyRewardPayout"("monthKey");

-- CreateIndex
CREATE INDEX "PtMonthlyRewardPayout_status_idx" ON "PtMonthlyRewardPayout"("status");

-- AddForeignKey
ALTER TABLE "PtMonthlyKpiPolicy" ADD CONSTRAINT "PtMonthlyKpiPolicy_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtMonthlyKpiSnapshot" ADD CONSTRAINT "PtMonthlyKpiSnapshot_ptAccountId_fkey" FOREIGN KEY ("ptAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtMonthlyRewardPayout" ADD CONSTRAINT "PtMonthlyRewardPayout_ptAccountId_fkey" FOREIGN KEY ("ptAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtMonthlyRewardPayout" ADD CONSTRAINT "PtMonthlyRewardPayout_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "PtMonthlyKpiSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtMonthlyRewardPayout" ADD CONSTRAINT "PtMonthlyRewardPayout_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
