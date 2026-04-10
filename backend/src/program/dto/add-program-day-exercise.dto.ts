import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class AddProgramDayExerciseDto {
  @IsNotEmpty()
  @IsUUID()
  exerciseId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  sortOrder: number;
}
