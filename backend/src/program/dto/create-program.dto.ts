import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ProgramLevel } from 'generated/prisma/enums';

export class CreateProgramDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(ProgramLevel)
  level: ProgramLevel;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek: number;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
