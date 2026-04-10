import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePackageDto } from './create-package.dto';

class UpdatePackageExtraDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePackageDto extends IntersectionType(
  PartialType(CreatePackageDto),
  UpdatePackageExtraDto,
) {}
