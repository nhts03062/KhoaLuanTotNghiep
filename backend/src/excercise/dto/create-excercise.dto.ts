import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ExerciseLevel, MuscleGroup } from 'generated/prisma/enums';

export class CreateExcerciseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsNotEmpty()
  @IsEnum(MuscleGroup)
  muscleGroup: MuscleGroup;

  @IsNotEmpty()
  @IsEnum(ExerciseLevel)
  level: ExerciseLevel;

  @IsOptional()
  @IsString()
  equipments?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  suggestion?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
