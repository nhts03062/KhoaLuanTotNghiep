import { IsOptional, IsString } from 'class-validator';

export class RejectPtAssistRequestDto {
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
