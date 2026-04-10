import { IsBoolean, IsInt, IsNotEmpty, IsOptional, Matches, Min } from 'class-validator';

export class UpsertPtMonthlyKpiPolicyDto {
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'monthKey must be yyyy-MM',
  })
  monthKey: string;

  @IsInt()
  @Min(0)
  targetTrainees: number;

  @IsInt()
  @Min(0)
  targetSessions: number;

  @IsInt()
  @Min(0)
  rewardAmount: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
