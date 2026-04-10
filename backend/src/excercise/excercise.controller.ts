import {
  Body,
  Controller,
  Delete,
  Get,
  Req,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExcerciseService } from './excercise.service';
import { CreateExcerciseDto } from './dto/create-excercise.dto';
import { FilterExcerciseDto } from './dto/filter-excercise.dto';
import { UpdateExcerciseDto } from './dto/update-excercise.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'generated/prisma/enums';

@Controller('exercise')
export class ExcerciseController {
  constructor(private readonly excerciseService: ExcerciseService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PT, Role.USER)
  @Get()
  findAll(@Req() req: any, @Query() filterExcerciseDto: FilterExcerciseDto) {
    return this.excerciseService.findAll(filterExcerciseDto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.excerciseService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PT)
  async create(
    @Req() req: any,
    @Body() createExcerciseDto: CreateExcerciseDto,
  ) {
    return this.excerciseService.create(createExcerciseDto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PT)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateExcerciseDto: UpdateExcerciseDto,
  ) {
    return this.excerciseService.update(id, updateExcerciseDto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PT)
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.excerciseService.remove(id, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }
}
