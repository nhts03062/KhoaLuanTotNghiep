-- CreateEnum
CREATE TYPE "SessionCompletion" AS ENUM ('COMPLETED', 'PARTIAL', 'NO_SHOW');

-- CreateTable
CREATE TABLE "PtSessionReport" (
    "id" TEXT NOT NULL,
    "ptAssistRequestId" TEXT NOT NULL,
    "ptAccountId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "completion" "SessionCompletion" NOT NULL DEFAULT 'COMPLETED',
    "summary" TEXT,
    "techniqueNote" TEXT,
    "improvement" TEXT,
    "nextSessionPlan" TEXT,
    "weightKg" DOUBLE PRECISION,
    "bodyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtSessionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PtSessionReport_ptAssistRequestId_key" ON "PtSessionReport"("ptAssistRequestId");

-- CreateIndex
CREATE INDEX "PtSessionReport_ptAccountId_createdAt_idx" ON "PtSessionReport"("ptAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "PtSessionReport_accountId_createdAt_idx" ON "PtSessionReport"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "PtSessionReport" ADD CONSTRAINT "PtSessionReport_ptAssistRequestId_fkey" FOREIGN KEY ("ptAssistRequestId") REFERENCES "PtAssistRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtSessionReport" ADD CONSTRAINT "PtSessionReport_ptAccountId_fkey" FOREIGN KEY ("ptAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtSessionReport" ADD CONSTRAINT "PtSessionReport_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
