import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddProgramDayExerciseDto } from './dto/add-program-day-exercise.dto';
import { CreateProgramDayDto } from './dto/create-program-day.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { FilterProgramDto } from './dto/filter-program.dto';

@Injectable()
export class ProgramService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProgramWriteAccess(
    programId: string,
    actor: { userId: string; role: Role },
  ) {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: { id: true, createdById: true },
    });
    if (!program) {
      throw new NotFoundException(`Program with id ${programId} not found`);
    }
    if (actor.role === Role.PT && program.createdById !== actor.userId) {
      throw new ForbiddenException('You can only modify programs you created');
    }
  }

  async findAll(
    filterProgramDto: FilterProgramDto,
    actor: { userId: string; role: Role },
  ) {
    const {
      page = 1,
      itemsPerPage = 10,
      search,
      isActive = true,
    } = filterProgramDto;
    const skip = (page - 1) * itemsPerPage;

    const where: Prisma.ProgramWhereInput = {
      isActive,
    };
    if (actor.role === Role.PT) {
      where.OR = [{ createdById: actor.userId }, { createdById: null }];
    }
    const trimmed = search?.trim();
    if (trimmed) {
      where.name = { contains: trimmed, mode: 'insensitive' };
    }

    const total = await this.prisma.program.count({ where });
    const totalPages = Math.ceil(total / itemsPerPage);
    const programs = await this.prisma.program.findMany({
      where,
      skip,
      take: itemsPerPage,
      orderBy: { createdAt: 'desc' },
      include: {
        days: {
          orderBy: { dayOfWeek: 'asc' },
          include: {
            exercises: {
              orderBy: { sortOrder: 'asc' },
              include: {
                exercise: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Get programs successfully',
      meta: {
        page,
        itemsPerPage,
        total,
        totalPages,
      },
      data: programs,
    };
  }

  async addProgramDayExercise(
    actor: { userId: string; role: Role },
    programId: string,
    programDayId: string,
    addProgramDayExerciseDto: AddProgramDayExerciseDto,
  ) {
    await this.assertProgramWriteAccess(programId, actor);

    const programDay = await this.prisma.programDay.findFirst({
      where: { id: programDayId, programId },
    });
    if (!programDay) {
      throw new NotFoundException(
        'Program day not found or does not belong to this program',
      );
    }

    const { exerciseId, sortOrder } = addProgramDayExerciseDto;

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise with id ${exerciseId} not found`);
    }
    if (!exercise.isActive) {
      throw new BadRequestException('Cannot add an inactive exercise');
    }

    const duplicate = await this.prisma.programDayExercise.findUnique({
      where: {
        programDayId_exerciseId: { programDayId, exerciseId },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'This exercise is already added to this program day',
      );
    }

    const programDayExercise = await this.prisma.programDayExercise.create({
      data: {
        programDayId,
        exerciseId,
        sortOrder,
      },
      include: {
        exercise: true,
      },
    });

    return {
      message: 'Add exercise to program day successfully',
      data: programDayExercise,
    };
  }

  async createProgramDay(
    actor: { userId: string; role: Role },
    programId: string,
    createProgramDayDto: CreateProgramDayDto,
  ) {
    await this.assertProgramWriteAccess(programId, actor);

    const { dayOfWeek, title, note } = createProgramDayDto;

    const duplicate = await this.prisma.programDay.findUnique({
      where: {
        programId_dayOfWeek: { programId, dayOfWeek },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'A program day for this day of week already exists',
      );
    }

    const programDay = await this.prisma.programDay.create({
      data: {
        programId,
        dayOfWeek,
        title,
        note,
      },
    });

    return {
      message: 'Create program day successfully',
      data: programDay,
    };
  }

  async create(
    createProgramDto: CreateProgramDto,
    actor: { userId: string; role: Role },
  ) {
    const { name, description, level, daysPerWeek, thumbnail, isActive } =
      createProgramDto;

    const program = await this.prisma.program.create({
      data: {
        createdById: actor.userId,
        name,
        description,
        level,
        daysPerWeek,
        thumbnail,
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return {
      message: 'Create program successfully',
      data: program,
    };
  }
}
