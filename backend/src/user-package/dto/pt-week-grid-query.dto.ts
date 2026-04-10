import { IsUUID, Matches } from 'class-validator';

export class PtWeekGridQueryDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  ptAccountId: string;

  /** Thứ Hai của tuần cần xem (yyyy-MM-dd); phải là thứ 2 theo calendar VN */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'weekStart must be yyyy-MM-dd',
  })
  weekStart: string;
}
