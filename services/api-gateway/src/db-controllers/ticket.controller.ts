import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../../../packages/database/src/entities/ticket.entity';

@Controller('tickets')
export class DbTicketController {
  constructor(
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
  ) {}

  @Get()
  async list(
    @Query('page') page = '1', @Query('limit') limit = '20',
    @Query('status') status?: string, @Query('userId') userId?: string,
  ) {
    const qb = this.ticketRepo.createQueryBuilder('t')
      .orderBy('t.createdAt', 'DESC');
    if (status) qb.andWhere('t.status = :status', { status });
    if (userId) qb.andWhere('t.userId = :userId', { userId });
    const [items, total] = await qb
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getManyAndCount();
    return { items, total, page: Number(page), limit: Number(limit) };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.ticketRepo.findOne({ where: { id } });
  }
}
