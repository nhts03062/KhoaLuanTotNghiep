import { IsOptional, Matches } from 'class-validator';

export class PtMonthlyKpiQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'monthKey must be yyyy-MM',
  })
  monthKey?: string;
}
