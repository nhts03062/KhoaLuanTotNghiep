-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userPackageId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckIn_accountId_checkedInAt_idx" ON "CheckIn"("accountId", "checkedInAt");

-- CreateIndex
CREATE INDEX "CheckIn_userPackageId_checkedInAt_idx" ON "CheckIn"("userPackageId", "checkedInAt");

-- CreateIndex
CREATE INDEX "CheckIn_branchId_checkedInAt_idx" ON "CheckIn"("branchId", "checkedInAt");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userPackageId_fkey" FOREIGN KEY ("userPackageId") REFERENCES "UserPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
