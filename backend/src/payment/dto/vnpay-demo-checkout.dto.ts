import { IsUUID } from 'class-validator';

export class VnpayDemoCheckoutDto {
  @IsUUID()
  packageId: string;
}
