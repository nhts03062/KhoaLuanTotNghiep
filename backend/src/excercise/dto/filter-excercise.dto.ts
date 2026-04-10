import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class FilterExcerciseDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  itemsPerPage?: number;

  /** Tìm theo tên bài tập (contains, không phân biệt hoa thường) */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return true;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isActive?: boolean;
}
