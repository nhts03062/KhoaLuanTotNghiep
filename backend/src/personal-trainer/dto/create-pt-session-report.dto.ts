import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { SessionCompletion } from 'generated/prisma/enums';

export class CreatePtSessionReportDto {
  @IsNotEmpty()
  @IsUUID()
  ptAssistRequestId: string;

  @IsNotEmpty()
  @IsEnum(SessionCompletion)
  completion: SessionCompletion;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  techniqueNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  improvement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nextSessionPlan?: string;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bodyNote?: string;
}
