-- CreateEnum
CREATE TYPE "PackageUnit" AS ENUM ('DAY', 'MONTH');

-- CreateEnum
CREATE TYPE "UserPackageStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "PackageUnit" NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "hasPt" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPackage" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "ptAccountId" TEXT,
    "status" "UserPackageStatus" NOT NULL DEFAULT 'PENDING',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPackage_accountId_status_idx" ON "UserPackage"("accountId", "status");

-- CreateIndex
CREATE INDEX "UserPackage_ptAccountId_idx" ON "UserPackage"("ptAccountId");

-- CreateIndex
CREATE INDEX "UserPackage_branchId_idx" ON "UserPackage"("branchId");

-- AddForeignKey
ALTER TABLE "UserPackage" ADD CONSTRAINT "UserPackage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPackage" ADD CONSTRAINT "UserPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPackage" ADD CONSTRAINT "UserPackage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
