-- Add ownership fields for Exercise and Program.
ALTER TABLE "Exercise"
ADD COLUMN "createdById" TEXT;

ALTER TABLE "Program"
ADD COLUMN "createdById" TEXT;

-- Existing rows remain NULL and are treated as admin-shared.

CREATE INDEX "Exercise_createdById_idx" ON "Exercise"("createdById");
CREATE INDEX "Program_createdById_idx" ON "Program"("createdById");

ALTER TABLE "Exercise"
ADD CONSTRAINT "Exercise_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "Account"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Program"
ADD CONSTRAINT "Program_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "Account"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
