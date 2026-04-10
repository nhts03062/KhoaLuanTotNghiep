import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommend-packages')
  @UseGuards(JwtAuthGuard)
  async recommendPackages(
    @Body() body: { userMessage: string; conversationId?: string },
    @Req() req: any,
  ) {
    return this.aiService.recommendPackages(
      req.user.userId,
      body.conversationId ?? 'default',
      body.userMessage,
    );
  }

  @Post('recommend-nutrition')
  @UseGuards(JwtAuthGuard)
  async recommendNutrition(
    @Body() body: { userMessage: string; conversationId?: string },
    @Req() req: any,
  ) {
    return this.aiService.recommendNutrition(
      req.user.userId,
      body.conversationId ?? 'default',
      body.userMessage,
    );
  }
}
