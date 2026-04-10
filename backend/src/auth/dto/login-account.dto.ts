import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginAccountDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
