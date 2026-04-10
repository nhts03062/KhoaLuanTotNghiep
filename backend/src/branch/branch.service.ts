import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterBranchDto } from './dto/filter-branch.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    const { name, address, phone } = createBranchDto;
    const branch = await this.prisma.branch.create({
      data: {
        name,
        address,
        phone,
      },
    });
    return {
      message: 'Create branch successfully',
      data: branch,
    };
  }

  async findAll(filterBranchDto: FilterBranchDto) {
    const { page = 1, itemsPerPage = 10, search = '' } = filterBranchDto;
    const skip = (page - 1) * itemsPerPage;

    const whereCondition = search
      ? {
          name: {
            contains: search,
          },
        }
      : {};
    const total = await this.prisma.branch.count({
      where: whereCondition,
    });
    const totalPages = Math.ceil(total / itemsPerPage);
    const branchs = await this.prisma.branch.findMany({
      where: whereCondition,
      skip,
      take: itemsPerPage,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Get branchs successfully',
      meta: {
        page,
        itemsPerPage,
        total,
        totalPages,
      },
      data: branchs,
    };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: {
        id: id,
      },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return {
      message: 'Get branch successfully',
      data: branch,
    };
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    const { name, address, phone } = updateBranchDto;
    const branch = await this.prisma.branch.update({
      where: { id: id },
      data: { name, address, phone },
    });
    return {
      message: 'Update branch successfully',
      data: branch,
    };
  }

  async delete(id: string) {
    const branch = await this.prisma.branch.delete({
      where: { id: id },
    });
    return {
      message: 'Delete branch successfully',
      data: branch,
    };
  }
}
