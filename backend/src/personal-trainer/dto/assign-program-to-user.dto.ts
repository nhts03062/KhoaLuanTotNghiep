import { IsUUID } from 'class-validator';

export class AssignProgramToUserDto {
  @IsUUID()
  userPackageId: string;

  @IsUUID()
  programId: string;
}
