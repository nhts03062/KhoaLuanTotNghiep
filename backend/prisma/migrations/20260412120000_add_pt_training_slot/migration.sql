-- CreateTable
CREATE TABLE "PtTrainingSlot" (
    "id" TEXT NOT NULL,
    "ptAccountId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtTrainingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PtTrainingSlot_ptAccountId_startTime_idx" ON "PtTrainingSlot"("ptAccountId", "startTime");

-- CreateIndex
CREATE INDEX "PtTrainingSlot_branchId_startTime_idx" ON "PtTrainingSlot"("branchId", "startTime");

-- AddForeignKey
ALTER TABLE "PtTrainingSlot" ADD CONSTRAINT "PtTrainingSlot_ptAccountId_fkey" FOREIGN KEY ("ptAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PtTrainingSlot" ADD CONSTRAINT "PtTrainingSlot_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
