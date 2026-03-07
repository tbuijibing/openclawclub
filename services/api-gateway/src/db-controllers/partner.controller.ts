import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerEarning } from '../../../../packages/database/src/entities/partner-earning.entity';
import { AuditLog } from '../../../../packages/database/src/entities/audit-log.entity';

@Controller()
export class DbPartnerController {
  constructor(
    @InjectRepository(PartnerEarning) private earningRepo: Repository<PartnerEarning>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  @Get('partners/earnings')
  async listEarnings(@Query('partnerId') partnerId?: string) {
    const where: any = {};
    if (partnerId) where.partnerId = partnerId;
    return this.earningRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  @Get('partners/earnings/:id')
  async getEarning(@Param('id') id: string) {
    return this.earningRepo.findOne({ where: { id } });
  }

  @Get('audit-logs')
  async listAuditLogs(
    @Query('page') page = '1', @Query('limit') limit = '50',
    @Query('userId') userId?: string, @Query('action') action?: string,
  ) {
    const qb = this.auditRepo.createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC');
    if (userId) qb.andWhere('a.userId = :userId', { userId });
    if (action) qb.andWhere('a.action LIKE :action', { action: `%${action}%` });
    const [items, total] = await qb
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getManyAndCount();
    return { items, total, page: Number(page), limit: Number(limit) };
  }
}
