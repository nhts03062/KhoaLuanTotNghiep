import { FunctionCallingConfigMode, GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiClient {
  private readonly ai: GoogleGenAI;
  constructor(private readonly configService: ConfigService) {
    this.ai = new GoogleGenAI({
      apiKey: this.configService.get<string>('GEMINI_API_KEY'),
    });
  }

  async generate(contents: any[], tools: any[]) {
    return this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        tools,
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });
  }
}
