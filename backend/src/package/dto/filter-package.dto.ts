import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PackageUnit } from 'generated/prisma/enums';

export class FilterPackageDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  itemsPerPage?: number;

  @IsOptional()
  @IsEnum(PackageUnit)
  unit?: PackageUnit;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return true;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isActive?: boolean;
}
