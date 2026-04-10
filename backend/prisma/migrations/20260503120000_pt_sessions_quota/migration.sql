-- AlterTable
ALTER TABLE "Package" ADD COLUMN "ptSessionsIncluded" INTEGER;

-- AlterTable
ALTER TABLE "UserPackage" ADD COLUMN "ptSessionsGranted" INTEGER;

-- Backfill package PT session counts for existing PT packages (adjust if needed)
UPDATE "Package" SET "ptSessionsIncluded" = 10 WHERE "hasPt" = true AND "ptSessionsIncluded" IS NULL;

-- Snapshot quota for subscriptions that already purchased PT packages
UPDATE "UserPackage" AS up
SET "ptSessionsGranted" = p."ptSessionsIncluded"
FROM "Package" AS p
WHERE up."packageId" = p.id
  AND p."hasPt" = true
  AND p."ptSessionsIncluded" IS NOT NULL;
