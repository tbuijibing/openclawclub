import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConciergeService } from './concierge.service';
import type {
  CreateSessionDto,
  SendMessageDto,
  EscalateRequest,
} from './types';

@Controller('concierge')
export class ConciergeServiceController {
  constructor(private readonly conciergeService: ConciergeService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'concierge-service' };
  }

  /** Create a new conversation session. Req: 14.1, 14.7 */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(@Body() dto: CreateSessionDto) {
    const session = this.conciergeService.createSession(
      dto.userId,
      dto.language,
      dto.scenario,
    );
    return {
      id: session.id,
      userId: session.userId,
      language: session.language,
      scenario: session.scenario,
      status: session.status,
      createdAt: session.createdAt,
    };
  }

  /** Send a message and get AI response. Req: 14.2, 14.4, 14.9 */
  @Post('sessions/:sessionId/messages')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conciergeService.sendMessage(sessionId, dto.content);
  }

  /** Generate service plan from collected requirements. Req: 14.3, 2.2 */
  @Post('sessions/:sessionId/service-plan')
  generateServicePlan(@Param('sessionId') sessionId: string) {
    return this.conciergeService.generateServicePlan(sessionId);
  }

  /** Confirm service plan and create order. Req: 2.3 */
  @Post('sessions/:sessionId/confirm-order')
  @HttpCode(HttpStatus.CREATED)
  confirmOrder(@Param('sessionId') sessionId: string) {
    return this.conciergeService.confirmOrder(sessionId);
  }

  /** Escalate to human agent. Req: 14.6 */
  @Post('sessions/:sessionId/escalate')
  escalateToHuman(
    @Param('sessionId') sessionId: string,
    @Body() dto: EscalateRequest,
  ) {
    return this.conciergeService.escalateToHuman(sessionId, dto.reason);
  }

  /** Get conversation history */
  @Get('sessions/:sessionId/history')
  getHistory(@Param('sessionId') sessionId: string) {
    return this.conciergeService.getConversationHistory(sessionId);
  }

  /** Get session details */
  @Get('sessions/:sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    const session = this.conciergeService.getSession(sessionId);
    return {
      id: session.id,
      userId: session.userId,
      language: session.language,
      scenario: session.scenario,
      status: session.status,
      collectedRequirements: session.collectedRequirements,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
