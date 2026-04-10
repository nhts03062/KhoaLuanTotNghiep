import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExcerciseDto } from './dto/create-excercise.dto';
import { FilterExcerciseDto } from './dto/filter-excercise.dto';
import { UpdateExcerciseDto } from './dto/update-excercise.dto';

@Injectable()
export class ExcerciseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filterExcerciseDto: FilterExcerciseDto,
    actor: { userId: string; role: Role },
  ) {
    const {
      page = 1,
      itemsPerPage = 10,
      search,
      isActive = true,
    } = filterExcerciseDto;
    const skip = (page - 1) * itemsPerPage;

    const where: Prisma.ExerciseWhereInput = {
      isActive,
    };
    if (actor.role === Role.PT) {
      where.OR = [{ createdById: actor.userId }, { createdById: null }];
    }
    const trimmed = search?.trim();
    if (trimmed) {
      where.name = { contains: trimmed, mode: 'insensitive' };
    }

    const total = await this.prisma.exercise.count({ where });
    const totalPages = Math.ceil(total / itemsPerPage);
    const exercises = await this.prisma.exercise.findMany({
      where,
      skip,
      take: itemsPerPage,
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Get exercises successfully',
      meta: {
        page,
        itemsPerPage,
        total,
        totalPages,
      },
      data: exercises,
    };
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise with id ${id} not found`);
    }
    return {
      message: 'Get exercise successfully',
      data: exercise,
    };
  }

  async create(
    createExcerciseDto: CreateExcerciseDto,
    actor: { userId: string; role: Role },
  ) {
    const {
      name,
      description,
      content,
      muscleGroup,
      level,
      equipments,
      thumbnail,
      videoUrl,
      suggestion,
      isActive,
    } = createExcerciseDto;

    const exercise = await this.prisma.exercise.create({
      data: {
        createdById: actor.userId,
        name,
        description,
        content,
        muscleGroup,
        level,
        equipments,
        thumbnail,
        videoUrl,
        suggestion,
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return {
      message: 'Create exercise successfully',
      data: exercise,
    };
  }

  async update(
    id: string,
    updateExcerciseDto: UpdateExcerciseDto,
    actor: { userId: string; role: Role },
  ) {
    const existing = await this.prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Exercise with id ${id} not found`);
    }
    if (actor.role === Role.PT && existing.createdById !== actor.userId) {
      throw new ForbiddenException('You can only update exercises you created');
    }

    const {
      name,
      description,
      content,
      muscleGroup,
      level,
      equipments,
      thumbnail,
      videoUrl,
      suggestion,
      isActive,
    } = updateExcerciseDto;

    const data: Prisma.ExerciseUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (content !== undefined) data.content = content;
    if (muscleGroup !== undefined) data.muscleGroup = muscleGroup;
    if (level !== undefined) data.level = level;
    if (equipments !== undefined) data.equipments = equipments;
    if (thumbnail !== undefined) data.thumbnail = thumbnail;
    if (videoUrl !== undefined) data.videoUrl = videoUrl;
    if (suggestion !== undefined) data.suggestion = suggestion;
    if (isActive !== undefined) data.isActive = isActive;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const exercise = await this.prisma.exercise.update({
      where: { id },
      data,
    });

    return {
      message: 'Update exercise successfully',
      data: exercise,
    };
  }

  async remove(id: string, actor: { userId: string; role: Role }) {
    const existing = await this.prisma.exercise.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Exercise with id ${id} not found`);
    }
    if (actor.role === Role.PT && existing.createdById !== actor.userId) {
      throw new ForbiddenException('You can only delete exercises you created');
    }
    await this.prisma.exercise.delete({
      where: { id },
    });
    return {
      message: 'Delete exercise successfully',
    };
  }
}
