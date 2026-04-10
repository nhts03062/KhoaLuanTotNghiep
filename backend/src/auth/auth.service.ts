import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginAccountDto } from './dto/login-account.dto';
import { AccountStatus } from 'generated/prisma/enums';
import { comparePassword } from 'src/utils/helpers';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(account: any) {
    const payload = {
      sub: account.id,
      email: account.email,
      role: account.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateAccount(loginAccountDto: LoginAccountDto): Promise<any> {
    const { email, password } = loginAccountDto;
    const account = await this.prisma.account.findUnique({
      where: {
        email: email,
        status: AccountStatus.ACTIVE,
      },
    });
    if (!account) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await comparePassword(password, account.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return account;
  }
}
