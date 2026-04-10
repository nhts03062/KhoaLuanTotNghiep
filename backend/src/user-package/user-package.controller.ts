import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserPackageService } from './user-package.service';
import { PurchasePackageDto } from './dto/purchase-package.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'generated/prisma/enums';
import { CheckinPackageDto } from './dto/checkin-package.dto';
import { CreatePtAssistRequestDto } from './dto/create-pt-assist-request.dto';
import { FilterPtTrainingHistoryDto } from './dto/filter-pt-training-history.dto';
import { CreateWorkoutHistoryDto } from './dto/create-workout-history.dto';
import { FilterWorkoutHistoryDto } from './dto/filter-workout-history.dto';
import { FilterPtTrainingSlotsForUserDto } from './dto/filter-pt-training-slots.dto';
import { FilterAvailablePtDto } from './dto/filter-available-pt.dto';
import { PtWeekGridQueryDto } from './dto/pt-week-grid-query.dto';

@Controller('user-package')
export class UserPackageController {
  constructor(private readonly userPackageService: UserPackageService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('purchase')
  async purchasePackage(
    @Req() req: any,
    @Body() purchasePackageDto: PurchasePackageDto,
  ) {
    return this.userPackageService.purchasePackage(
      req.user.userId,
      purchasePackageDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('my-packages')
  async getUserPackages(@Req() req: any) {
    return this.userPackageService.getUserPackages(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('my-packages/:id')
  async getUserDetailPackage(@Req() req: any, @Param('id') id: string) {
    return this.userPackageService.getUserDetailPackage(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('pt-training-history')
  async getPtTrainingHistory(
    @Req() req: any,
    @Query() filter: FilterPtTrainingHistoryDto,
  ) {
    return this.userPackageService.getPtTrainingHistory(
      req.user.userId,
      filter,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('today-exercises')
  async getTodayExercises(@Req() req: any) {
    return this.userPackageService.getTodayExercises(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('available-pts')
  async getAvailablePTs(@Query() filter: FilterAvailablePtDto) {
    return this.userPackageService.getAvailablePTs(filter);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('pt-week-booking-grid')
  async getPtWeekBookingGrid(@Query() q: PtWeekGridQueryDto) {
    return this.userPackageService.getPtWeekBookingGrid(q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('workout-history')
  async createWorkoutHistory(
    @Req() req: any,
    @Body() createWorkoutHistoryDto: CreateWorkoutHistoryDto,
  ) {
    return this.userPackageService.createWorkoutHistory(
      req.user.userId,
      createWorkoutHistoryDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('workout-history')
  async getWorkoutHistory(
    @Req() req: any,
    @Query() filter: FilterWorkoutHistoryDto,
  ) {
    return this.userPackageService.getWorkoutHistory(req.user.userId, filter);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.USER)
  // @Get('pt-training-slots')
  // async getPtTrainingSlots(
  //   @Req() req: any,
  //   @Query() filter: FilterPtTrainingSlotsForUserDto,
  // ) {
  //   return this.userPackageService.getPtTrainingSlotsForUser(
  //     req.user.userId,
  //     filter,
  //   );
  // }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('pt-assist-request')
  async createPtAssistRequest(
    @Req() req: any,
    @Body() createPtAssistRequestDto: CreatePtAssistRequestDto,
  ) {
    return this.userPackageService.createRequestPT(
      req.user.userId,
      createPtAssistRequestDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('checkin')
  async checkinPackage(
    @Req() req: any,
    @Body() checkinPackageDto: CheckinPackageDto,
  ) {
    return this.userPackageService.checkinPackage(
      req.user.userId,
      checkinPackageDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('checkins')
  async getCheckins(@Req() req: any) {
    return this.userPackageService.getCheckins(req.user.userId);
  }

  @Get('checkins/grouped')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getGrouped(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.userPackageService.getCheckinsGrouped(
      req.user.userId,
      from,
      to,
    );
  }
}
