import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiClient } from './tools/gemini.client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300,
      max: 200,
    }),
  ],
  controllers: [AiController],
  providers: [AiService, GeminiClient, PrismaService],
})
export class AiModule {}
