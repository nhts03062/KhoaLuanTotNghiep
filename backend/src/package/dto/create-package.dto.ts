import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { PackageUnit } from 'generated/prisma/enums';

export class CreatePackageDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(PackageUnit)
  unit: PackageUnit;

  @IsNotEmpty()
  @IsNumber()
  durationValue: number;

  @IsNotEmpty()
  @IsBoolean()
  hasPt: boolean;

  /** Bắt buộc khi hasPt = true */
  @ValidateIf((o: CreatePackageDto) => o.hasPt === true)
  @IsNotEmpty({ message: 'ptSessionsIncluded is required when hasPt is true' })
  @IsNumber()
  @Min(1)
  ptSessionsIncluded?: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}
