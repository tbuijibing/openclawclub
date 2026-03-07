import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationSession } from '../../../../packages/database/src/entities/conversation-session.entity';
import { ConversationMessage } from '../../../../packages/database/src/entities/conversation-message.entity';

@Controller('concierge')
export class DbConciergeController {
  constructor(
    @InjectRepository(ConversationSession) private sessionRepo: Repository<ConversationSession>,
    @InjectRepository(ConversationMessage) private msgRepo: Repository<ConversationMessage>,
  ) {}

  @Get('sessions')
  async listSessions(@Query('userId') userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    return this.sessionRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.sessionRepo.findOne({ where: { id }, relations: ['messages'] });
  }

  @Get('sessions/:id/messages')
  async getMessages(@Param('id') sessionId: string) {
    return this.msgRepo.find({ where: { sessionId }, order: { createdAt: 'ASC' } });
  }
}
