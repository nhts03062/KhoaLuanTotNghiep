UPDATE "PtWeeklySlot"
SET "shiftType" = CASE
  WHEN "startTime" < '13:00' THEN 'MORNING'::"ShiftType"
  WHEN "startTime" < '17:00' THEN 'AFTERNOON'::"ShiftType"
  ELSE 'EVENING'::"ShiftType"
END
WHERE "shiftType" IS NULL;