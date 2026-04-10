-- AddForeignKey
ALTER TABLE "UserPackage" ADD CONSTRAINT "UserPackage_ptAccountId_fkey" FOREIGN KEY ("ptAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
