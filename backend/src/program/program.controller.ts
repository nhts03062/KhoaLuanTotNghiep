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
import { ProgramService } from './program.service';
import { AddProgramDayExerciseDto } from './dto/add-program-day-exercise.dto';
import { CreateProgramDayDto } from './dto/create-program-day.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { FilterProgramDto } from './dto/filter-program.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'generated/prisma/enums';

@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PT, Role.USER)
  @Get()
  findAll(@Req() req: any, @Query() filterProgramDto: FilterProgramDto) {
    return this.programService.findAll(filterProgramDto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PT)
  async create(@Req() req: any, @Body() createProgramDto: CreateProgramDto) {
    return this.programService.create(createProgramDto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Post(':programId/days/:programDayId/exercises')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PT)
  async addProgramDayExercise(
    @Req() req: any,
    @Param('programId') programId: string,
    @Param('programDayId') programDayId: string,
    @Body() addProgramDayExerciseDto: AddProgramDayExerciseDto,
  ) {
    return this.programService.addProgramDayExercise(
      {
        userId: req.user.userId,
        role: req.user.role,
      },
      programId,
      programDayId,
      addProgramDayExerciseDto,
    );
  }

  @Post(':programId/days')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PT)
  async createProgramDay(
    @Req() req: any,
    @Param('programId') programId: string,
    @Body() createProgramDayDto: CreateProgramDayDto,
  ) {
    return this.programService.createProgramDay(
      {
        userId: req.user.userId,
        role: req.user.role,
      },
      programId,
      createProgramDayDto,
    );
  }
}
