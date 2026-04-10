import {
  Matches,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePtAssistRequestDto {
  @IsNotEmpty()
  @IsUUID()
  userPackageId: string;

  @IsNotEmpty()
  @IsUUID()
  slotId: string;

  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'sessionDate must be yyyy-MM-dd',
  })
  sessionDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
