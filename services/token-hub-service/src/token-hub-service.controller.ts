import { Controller, Post, Get, Body, Res, Headers, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { TokenHubService } from './token-hub.service';
import { AuditService } from './audit.service';
import { UserKeyService } from './user-key.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';

@Controller()
export class TokenHubServiceController {
  constructor(
    private readonly tokenHubService: TokenHubService,
    private readonly auditService: AuditService,
    private readonly userKeyService: UserKeyService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'token-hub-service' };
  }

  /**
   * OpenAI-compatible chat completion endpoint.
   * Supports both streaming (SSE) and non-streaming responses.
   * Logs call metadata for audit (never stores conversation content — req 15.10).
   */
  @Post('v1/chat/completions')
  async chatCompletion(
    @Body() dto: ChatCompletionDto,
    @Headers('x-user-id') userId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const startTime = Date.now();
    const effectiveUserId = userId ?? 'anonymous';
    const directMode = this.isDirectMode(effectiveUserId);

    try {
      if (dto.stream) {
        await this.handleStreamResponse(dto, res, effectiveUserId, directMode, startTime);
      } else {
        const result = await this.tokenHubService.chatCompletion(dto);
        const route = this.tokenHubService.getRoute(dto);

        this.auditService.logApiCall({
          userId: effectiveUserId,
          model: result.model,
          provider: route.provider,
          promptTokens: result.usage.prompt_tokens,
          completionTokens: result.usage.completion_tokens,
          totalTokens: result.usage.total_tokens,
          directMode,
          durationMs: Date.now() - startTime,
          responseType: 'json',
        });

        res.json(result);
      }
    } catch (error: any) {
      const status = error instanceof HttpException
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json({
        error: {
          message: error.message ?? 'Internal server error',
          type: 'api_error',
        },
      });
    }
  }

  private isDirectMode(userId: string): boolean {
    if (userId === 'anonymous') return false;
    return this.userKeyService.getMode(userId) === 'direct';
  }

  private async handleStreamResponse(
    dto: ChatCompletionDto,
    res: Response,
    userId: string,
    directMode: boolean,
    startTime: number,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = this.tokenHubService.chatCompletionStream(dto);
    const route = this.tokenHubService.getRoute(dto);
    let chunkCount = 0;

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      chunkCount++;
    }

    // Audit log for streaming calls — token counts estimated from chunk count
    this.auditService.logApiCall({
      userId,
      model: route.model,
      provider: route.provider,
      promptTokens: 0, // exact counts unavailable in streaming
      completionTokens: 0,
      totalTokens: 0,
      directMode,
      durationMs: Date.now() - startTime,
      responseType: 'stream',
    });

    res.write('data: [DONE]\n\n');
    res.end();
  }
}
