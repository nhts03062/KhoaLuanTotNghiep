import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';

export class AdminAnalyticsQueryDto {
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

  @IsOptional()
  @IsIn(['day', 'month', 'year'])
  groupBy?: 'day' | 'month' | 'year';

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;
}
