import { PtMonthlyRewardPayoutStatus } from 'generated/prisma/enums';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePtMonthlyPayoutDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  amountFinal?: number;

  @IsOptional()
  @IsEnum(PtMonthlyRewardPayoutStatus)
  status?: PtMonthlyRewardPayoutStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
