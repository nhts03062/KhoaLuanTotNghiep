import { Module } from '@nestjs/common';
import { PackageService } from './package.service';
import { PackageController } from './package.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PackageController],
  providers: [PackageService, PrismaService],
})
export class PackageModule {}
