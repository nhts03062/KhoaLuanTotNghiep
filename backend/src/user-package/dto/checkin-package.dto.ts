import { IsUUID } from 'class-validator';

export class CheckinPackageDto {
  @IsUUID()
  userPackageId: string;

  @IsUUID()
  branchId: string;
}
