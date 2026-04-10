import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AiToolHandlers } from './tools/ai.tool.handlers';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeminiClient } from './tools/gemini.client';
import { TOOL_DECLS } from './tools/ai.tools';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class AiService {
  private readonly aiToolHandlers: AiToolHandlers;
  constructor(
    prisma: PrismaService,
    private readonly gemini: GeminiClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.aiToolHandlers = new AiToolHandlers(prisma);
  }

  private buildHistoryKey(
    accountId: string,
    conversationId: string,
    scope: 'packages' | 'nutrition',
  ) {
    return `ai:history:${scope}:${accountId}:${conversationId}`;
  }

  async recommendPackages(
    accountId: string,
    conversationId: string,
    userMessage: string,
  ) {
    const key = this.buildHistoryKey(accountId, conversationId, 'packages');
    const systemPrompt = `
  Bạn là trợ lý gợi ý gói tập của BestGym.
  Nhiệm vụ:
  - Thu thập thông tin còn thiếu (mục tiêu, chiều cao, cân nặng, ưu tiên PT, ngân sách nếu có).
  - Dùng tool để lấy dữ liệu thật từ DB.
  - Chỉ gợi ý tối đa 3 gói phù hợp nhất, nêu lý do ngắn gọn.
  - Nếu thiếu dữ liệu quan trọng, hỏi lại user trước khi kết luận.
  `;

    const cached = (await this.cache.get<any[]>(key)) ?? [];
    let contents: any[] = [...cached];
    if (!contents.length) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    for (let i = 0; i < 5; i++) {
      const res = await this.gemini.generate(contents, [
        { functionDeclarations: TOOL_DECLS },
      ]);

      // 1) Get function calls from model response
      const parts = res.candidates?.[0]?.content?.parts ?? [];
      const functionCalls = parts
        .map((p: any) => p.functionCall)
        .filter(Boolean);

      // 2) If no more function calls => return final text
      if (!functionCalls.length) {
        contents.push({
          role: 'model',
          parts: parts.filter((p: any) => p.text),
        });
        await this.cache.set(key, contents, 300);
        return {
          message: 'Recommend packages successfully',
          data: {
            text:
              res.text ??
              parts
                .map((p: any) => p.text)
                .filter(Boolean)
                .join('\n'),
          },
        };
      }

      // 3) Add function calls to history
      contents.push({
        role: 'model',
        parts: functionCalls.map((fc: any) => ({ functionCall: fc })),
      });

      // 4) Execute tool calls
      const toolResponseParts: any[] = [];
      for (const fc of functionCalls) {
        const name = fc.name as string;
        const args = fc.args ?? {};
        console.log('name', name);
        console.log('args', args);

        let result: any;
        switch (name) {
          case 'getUserProfile':
            result = await this.aiToolHandlers.getUserProfile(accountId); // ignore args.accountId
            break;
          case 'listPackages':
            result = await this.aiToolHandlers.listPackages(args);
            break;
          case 'listPrograms':
            result = await this.aiToolHandlers.listPrograms(args);
            break;
          case 'calcNutritionMacros':
            result = this.aiToolHandlers.calcNutritionMacros(args);
            break;
          default:
            result = { error: `Unknown function: ${name}` };
        }

        toolResponseParts.push({
          functionResponse: {
            name,
            response: {
              output: result, // result có thể array/object đều OK
            },
          },
        });
      }

      // 5) Append tool responses to history for model to reason further
      contents.push({
        role: 'tool',
        parts: toolResponseParts,
      });
    }

    await this.cache.set(key, contents, 300);
    throw new Error('Model exceeded tool-call loop limit');
  }

  async recommendNutrition(
    accountId: string,
    conversationId: string,
    userMessage: string,
  ) {
    const key = this.buildHistoryKey(accountId, conversationId, 'nutrition');
    const systemPrompt = `
  Bạn là trợ lý gợi ý dinh dưỡng của BestGym.
  Nhiệm vụ:
  - Thu thập thông tin còn thiếu (mục tiêu, chiều cao, cân nặng, mức vận động).
  - Ưu tiên dùng tool calcNutritionMacros để tính calories/macros.
  - Có thể dùng getUserProfile để lấy dữ liệu hồ sơ hiện có.
  - Trả lời ngắn gọn, thực tế, an toàn; nêu tổng calories và macros rõ ràng.
  - Khi đã đủ dữ liệu, đề xuất thực đơn 1 ngày đơn giản (3-4 bữa) theo mục tiêu.
  `;

    const cached = (await this.cache.get<any[]>(key)) ?? [];
    let contents: any[] = [...cached];
    if (!contents.length) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    for (let i = 0; i < 5; i++) {
      const res = await this.gemini.generate(contents, [
        { functionDeclarations: TOOL_DECLS },
      ]);

      const parts = res.candidates?.[0]?.content?.parts ?? [];
      const functionCalls = parts
        .map((p: any) => p.functionCall)
        .filter(Boolean);

      if (!functionCalls.length) {
        contents.push({
          role: 'model',
          parts: parts.filter((p: any) => p.text),
        });
        await this.cache.set(key, contents, 300);
        return {
          message: 'Recommend nutrition successfully',
          data: {
            text:
              res.text ??
              parts
                .map((p: any) => p.text)
                .filter(Boolean)
                .join('\n'),
          },
        };
      }

      contents.push({
        role: 'model',
        parts: functionCalls.map((fc: any) => ({ functionCall: fc })),
      });

      const toolResponseParts: any[] = [];
      for (const fc of functionCalls) {
        const name = fc.name as string;
        const args = fc.args ?? {};

        let result: any;
        switch (name) {
          case 'getUserProfile':
            result = await this.aiToolHandlers.getUserProfile(accountId);
            break;
          case 'listPackages':
            result = await this.aiToolHandlers.listPackages(args);
            break;
          case 'listPrograms':
            result = await this.aiToolHandlers.listPrograms(args);
            break;
          case 'calcNutritionMacros':
            result = this.aiToolHandlers.calcNutritionMacros(args);
            break;
          default:
            result = { error: `Unknown function: ${name}` };
        }

        toolResponseParts.push({
          functionResponse: {
            name,
            response: {
              output: result,
            },
          },
        });
      }

      contents.push({
        role: 'tool',
        parts: toolResponseParts,
      });
    }

    await this.cache.set(key, contents, 300);
    throw new Error('Model exceeded tool-call loop limit');
  }
}
