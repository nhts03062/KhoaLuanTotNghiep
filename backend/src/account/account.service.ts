import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreatePtAccountDto } from './dto/create-pt-account.dto';
import {
  generateVerificationCode,
  getExpirationTime,
  hashPassword,
} from 'src/utils/helpers';
import { MailService } from 'src/mail/mail.service';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { AccountStatus, Role } from 'generated/prisma/enums';
import { FilterPtDto } from './dto/filter-pt.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdatePtDto } from './dto/admin-update-pt.dto';

type AdminAccountProfileUpdateDto = AdminUpdateUserDto | AdminUpdatePtDto;

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async isEmailExists(email: string) {
    const account = await this.prisma.account.findUnique({
      where: {
        email: email,
      },
    });
    return !!account;
  }

  async createAccount(createAccountDto: CreateAccountDto) {
    const { email, password, confirmPassword } = createAccountDto;
    const hashedPassword = await hashPassword(password);
    const verificationCode = generateVerificationCode();
    const expirationTime = getExpirationTime(10);

    const accountExists = await this.isEmailExists(email);
    if (accountExists) {
      throw new BadRequestException('Email already exists');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    const account = await this.prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpire: expirationTime,
      },
    });
    if (!account) {
      throw new BadRequestException('Failed to create account');
    }

    await this.prisma.profile.create({
      data: {
        accountId: account.id,
      },
    });

    await this.mailService.sendVerificationEmail(
      email,
      verificationCode,
      email,
    );
    return account;
  }

  async createPtAccount(dto: CreatePtAccountDto) {
    const { email, password, confirmPassword, name, phone, gender } = dto;

    if (password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    if (await this.isEmailExists(email)) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const account = await this.prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.PT,
        status: AccountStatus.ACTIVE,
        profile: {
          create: {
            name,
            ...(phone ? { phone } : {}),
            ...(gender ? { gender } : {}),
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            name: true,
            phone: true,
            gender: true,
          },
        },
      },
    });

    return {
      message: 'Create PT account successfully',
      data: account,
    };
  }

  async getMyProfile(accountId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { accountId },
      include: {
        account: { select: { email: true } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const { account, ...profileFields } = profile;
    return {
      message: 'Get profile successfully',
      data: {
        ...profileFields,
        email: account.email,
      },
    };
  }

  async updateMyProfile(accountId: string, updateProfileDto: UpdateProfileDto) {
    const { dateOfBirth, ...rest } = updateProfileDto;

    const profile = await this.prisma.profile.upsert({
      where: { accountId },
      create: {
        accountId,
        ...rest,
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      },
      update: {
        ...rest,
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      },
      include: {
        account: { select: { email: true } },
      },
    });

    const { account, ...profileFields } = profile;
    return {
      message: 'Update profile successfully',
      data: {
        ...profileFields,
        email: account.email,
      },
    };
  }

  async verifyAccount(verifyAccountDto: VerifyAccountDto) {
    const { email, verificationCode } = verifyAccountDto;
    const account = await this.prisma.account.findUnique({
      where: {
        email: email,
        verificationCode: verificationCode,
        verificationCodeExpire: {
          gt: new Date(),
        },
      },
    });
    if (!account) {
      throw new BadRequestException('Invalid verification code');
    }

    const updatedAccount = await this.prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        status: AccountStatus.ACTIVE,
        verificationCode: null,
        verificationCodeExpire: null,
      },
    });
    return {
      message: 'Account verified successfully',
      account: updatedAccount,
    };
  }

  async getPTAccounts(filterPtDto: FilterPtDto) {
    const { page = 1, itemsPerPage = 10, search = '' } = filterPtDto;
    const skip = (page - 1) * itemsPerPage;

    const whereCondition = search
      ? {
          email: {
            contains: search,
          },
          role: Role.PT,
          status: AccountStatus.ACTIVE,
        }
      : {
          role: Role.PT,
          status: AccountStatus.ACTIVE,
        };
    const total = await this.prisma.account.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(total / itemsPerPage);
    const ptAccounts = await this.prisma.account.findMany({
      where: whereCondition,
      skip,
      take: itemsPerPage,
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            name: true,
            gender: true,
            phone: true,
            dateOfBirth: true,
            avatar: true,
            height: true,
            weight: true,
            fitnessGoal: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      message: 'Get PT accounts successfully',
      meta: {
        page,
        itemsPerPage,
        total,
        totalPages,
      },
      data: ptAccounts,
    };
  }

  private async findAccountByRoleOrThrow(
    accountId: string,
    role: typeof Role.USER | typeof Role.PT,
  ) {
    const label = role === Role.USER ? 'User' : 'PT';
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, role },
      include: { profile: true },
    });
    if (!account) {
      throw new NotFoundException(`${label} account not found`);
    }
    return account;
  }

  private adminManagedAccountSelect() {
    return {
      id: true,
      email: true,
      status: true,
      role: true,
      createdAt: true,
      profile: {
        select: {
          name: true,
          gender: true,
          phone: true,
          dateOfBirth: true,
          avatar: true,
          height: true,
          weight: true,
          fitnessGoal: true,
        },
      },
    } as const;
  }

  private async applyAdminEmailProfileUpdate(
    accountId: string,
    dto: AdminAccountProfileUpdateDto,
  ) {
    const {
      email,
      dateOfBirth,
      name,
      gender,
      phone,
      avatar,
      height,
      weight,
      fitnessGoal,
    } = dto;

    const hasProfileField =
      name !== undefined ||
      gender !== undefined ||
      phone !== undefined ||
      dateOfBirth !== undefined ||
      avatar !== undefined ||
      height !== undefined ||
      weight !== undefined ||
      fitnessGoal !== undefined;

    if (!email && !hasProfileField) {
      throw new BadRequestException('At least one field is required to update');
    }

    if (email) {
      const existing = await this.prisma.account.findFirst({
        where: { email, NOT: { id: accountId } },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestException('Email already exists');
      }
    }

    const profileData = hasProfileField
      ? {
          ...(name !== undefined ? { name } : {}),
          ...(gender !== undefined ? { gender } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(dateOfBirth !== undefined
            ? { dateOfBirth: new Date(dateOfBirth) }
            : {}),
          ...(avatar !== undefined ? { avatar } : {}),
          ...(height !== undefined ? { height } : {}),
          ...(weight !== undefined ? { weight } : {}),
          ...(fitnessGoal !== undefined ? { fitnessGoal } : {}),
        }
      : undefined;

    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...(email ? { email } : {}),
        ...(profileData
          ? {
              profile: {
                upsert: {
                  create: profileData,
                  update: profileData,
                },
              },
            }
          : {}),
      },
      select: this.adminManagedAccountSelect(),
    });
  }

  private async deactivateAccountByRole(
    accountId: string,
    role: typeof Role.USER | typeof Role.PT,
  ) {
    const label = role === Role.USER ? 'User' : 'PT';
    const account = await this.findAccountByRoleOrThrow(accountId, role);

    if (account.status === AccountStatus.INACTIVE) {
      return {
        message: `${label} account is already inactive`,
        data: {
          id: account.id,
          email: account.email,
          status: account.status,
        },
      };
    }

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: { status: AccountStatus.INACTIVE },
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
      },
    });

    return {
      message: `Deactivate ${label.toLowerCase()} account successfully`,
      data: updated,
    };
  }

  async updateUserAccountByAdmin(accountId: string, dto: AdminUpdateUserDto) {
    await this.findAccountByRoleOrThrow(accountId, Role.USER);
    const updated = await this.applyAdminEmailProfileUpdate(accountId, dto);
    return {
      message: 'Update user account successfully',
      data: updated,
    };
  }

  async deactivateUserAccountByAdmin(accountId: string) {
    return this.deactivateAccountByRole(accountId, Role.USER);
  }

  async updatePtAccountByAdmin(accountId: string, dto: AdminUpdatePtDto) {
    await this.findAccountByRoleOrThrow(accountId, Role.PT);
    const updated = await this.applyAdminEmailProfileUpdate(accountId, dto);
    return {
      message: 'Update PT account successfully',
      data: updated,
    };
  }

  async deactivatePtAccountByAdmin(accountId: string) {
    return this.deactivateAccountByRole(accountId, Role.PT);
  }

  async getUserAccounts(filterUserDto: FilterUserDto) {
    const { page = 1, itemsPerPage = 10, search = '' } = filterUserDto;
    const skip = (page - 1) * itemsPerPage;

    const whereCondition = search
      ? {
          email: {
            contains: search,
          },
          role: Role.USER,
          status: AccountStatus.ACTIVE,
        }
      : {
          role: Role.USER,
          status: AccountStatus.ACTIVE,
        };
    const total = await this.prisma.account.count({
      where: whereCondition,
    });
    const totalPages = Math.ceil(total / itemsPerPage);
    const userAccounts = await this.prisma.account.findMany({
      where: whereCondition,
      skip,
      take: itemsPerPage,
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      message: 'Get user accounts successfully',
      meta: {
        page,
        itemsPerPage,
        total,
        totalPages,
      },
      data: userAccounts,
    };
  }
}
