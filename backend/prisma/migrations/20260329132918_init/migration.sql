-- CreateEnum
CREATE TYPE "PtAssistRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PtAssistRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userPackageId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "ptAccountId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "PtAssistRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtAssistRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PtAssistRequest_ptAccountId_status_idx" ON "PtAssistRequest"("ptAccountId", "status");

-- CreateIndex
CREATE INDEX "PtAssistRequest_accountId_startTime_idx" ON "PtAssistRequest"("accountId", "startTime");

-- CreateIndex
CREATE INDEX "PtAssistRequest_branchId_startTime_idx" ON "PtAssistRequest"("branchId", "startTime");

-- CreateIndex
CREATE INDEX "PtAssistRequest_userPackageId_startTime_idx" ON "PtAssistRequest"("userPackageId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "PtAssistRequest_accountId_ptAccountId_startTime_endTime_key" ON "PtAssistRequest"("accountId", "ptAccountId", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "PtAssistRequest" ADD CONSTRAINT "PtAssistRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtAssistRequest" ADD CONSTRAINT "PtAssistRequest_userPackageId_fkey" FOREIGN KEY ("userPackageId") REFERENCES "UserPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtAssistRequest" ADD CONSTRAINT "PtAssistRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtAssistRequest" ADD CONSTRAINT "PtAssistRequest_ptAccountId_fkey" FOREIGN KEY ("ptAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
