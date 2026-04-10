import { WorkoutHistoryStatus } from 'generated/prisma/enums';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkoutHistoryDto {
  @IsNotEmpty()
  @IsString()
  userPackageId: string;

  @IsNotEmpty()
  @IsString()
  programDayId: string;

  @IsOptional()
  @IsDateString()
  workoutAt?: string;

  @IsOptional()
  @IsEnum(WorkoutHistoryStatus)
  status?: WorkoutHistoryStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
