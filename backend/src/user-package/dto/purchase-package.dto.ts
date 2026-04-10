import { IsUUID } from 'class-validator';

export class PurchasePackageDto {
  @IsUUID()
  packageId: string;

  @IsUUID()
  branchId: string;
}
