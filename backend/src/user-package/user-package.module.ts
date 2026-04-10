import { Module } from '@nestjs/common';
import { UserPackageService } from './user-package.service';
import { UserPackageController } from './user-package.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UserPackageController],
  providers: [UserPackageService, PrismaService],
})
export class UserPackageModule {}
