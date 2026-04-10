-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'ABS', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "ExerciseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "level" "ExerciseLevel" NOT NULL,
    "equipments" TEXT,
    "thumbnail" TEXT,
    "videoUrl" TEXT,
    "suggestion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_muscleGroup_idx" ON "Exercise"("muscleGroup");

-- CreateIndex
CREATE INDEX "Exercise_level_idx" ON "Exercise"("level");

-- CreateIndex
CREATE INDEX "Exercise_isActive_idx" ON "Exercise"("isActive");
