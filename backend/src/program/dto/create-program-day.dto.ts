import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateProgramDayDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
