import { IsOptional, Matches } from 'class-validator';

export class FilterWorkoutHistoryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must be yyyy-MM-dd',
  })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must be yyyy-MM-dd',
  })
  to?: string;
}
