import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { FitnessGoal, Gender } from 'generated/prisma/enums';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: false })
  avatar?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  weight?: number;

  @IsOptional()
  @IsEnum(FitnessGoal)
  fitnessGoal?: FitnessGoal;
}

