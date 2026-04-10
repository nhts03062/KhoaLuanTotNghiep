import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreatePtAccountDto } from './dto/create-pt-account.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'generated/prisma/enums';
import { FilterPtDto } from './dto/filter-pt.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdatePtDto } from './dto/admin-update-pt.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('sign-up')
  async signUp(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.createAccount(createAccountDto);
  }

  @Post('verify-account')
  async verifyAccount(@Body() verifyAccountDto: VerifyAccountDto) {
    return this.accountService.verifyAccount(verifyAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getMyProfile(@Req() req: any) {
    return this.accountService.getMyProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateMyProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    return this.accountService.updateMyProfile(req.user.userId, updateProfileDto);
  }

  @Get('pt-accounts')
  async getPTAccounts(@Query() filterPtDto: FilterPtDto) {
    return this.accountService.getPTAccounts(filterPtDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('pt-accounts')
  async createPtAccount(@Body() dto: CreatePtAccountDto) {
    return this.accountService.createPtAccount(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('pt-accounts/:id')
  async updatePtAccount(
    @Param('id') id: string,
    @Body() dto: AdminUpdatePtDto,
  ) {
    return this.accountService.updatePtAccountByAdmin(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('pt-accounts/:id')
  async deactivatePtAccount(@Param('id') id: string) {
    return this.accountService.deactivatePtAccountByAdmin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('user-accounts')
  async getUserAccounts(@Query() filterUserDto: FilterUserDto) {
    return this.accountService.getUserAccounts(filterUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('user-accounts/:id')
  async updateUserAccount(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.accountService.updateUserAccountByAdmin(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('user-accounts/:id')
  async deactivateUserAccount(@Param('id') id: string) {
    return this.accountService.deactivateUserAccountByAdmin(id);
  }
}
