import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenAccount } from '../../../../packages/database/src/entities/token-account.entity';
import { TokenUsageRecord } from '../../../../packages/database/src/entities/token-usage-record.entity';

@Controller('token-hub')
export class DbTokenHubController {
  constructor(
    @InjectRepository(TokenAccount) private accountRepo: Repository<TokenAccount>,
    @InjectRepository(TokenUsageRecord) private usageRepo: Repository<TokenUsageRecord>,
  ) {}

  @Get('accounts')
  async listAccounts(@Query('userId') userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    return this.accountRepo.find({ where });
  }

  @Get('accounts/:id')
  async getAccount(@Param('id') id: string) {
    return this.accountRepo.findOne({ where: { id } });
  }

  @Get('accounts/:id/usage')
  async getUsage(
    @Param('id') accountId: string,
    @Query('page') page = '1', @Query('limit') limit = '20',
  ) {
    const [items, total] = await this.usageRepo.findAndCount({
      where: { accountId },
      order: { createdAt: 'DESC' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    return { items, total, page: Number(page), limit: Number(limit) };
  }

  @Get('usage/summary')
  async usageSummary(@Query('userId') userId?: string) {
    const qb = this.usageRepo.createQueryBuilder('u')
      .innerJoin('u.account', 'a')
      .select('u.provider', 'provider')
      .addSelect('u.model', 'model')
      .addSelect('SUM(u.totalTokens)', 'totalTokens')
      .addSelect('SUM(u.costUsd)', 'totalCost')
      .addSelect('SUM(u.priceUsd)', 'totalPrice')
      .groupBy('u.provider').addGroupBy('u.model');
    if (userId) qb.andWhere('a.userId = :userId', { userId });
    return qb.getRawMany();
  }
}
