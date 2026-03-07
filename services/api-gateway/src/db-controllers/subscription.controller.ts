import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../../../packages/database/src/entities/subscription.entity';
import { ConfigurationPack } from '../../../../packages/database/src/entities/configuration-pack.entity';

@Controller('subscriptions')
export class DbSubscriptionController {
  constructor(
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(ConfigurationPack) private packRepo: Repository<ConfigurationPack>,
  ) {}

  @Get()
  async list(@Query('userId') userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    return this.subRepo.find({ where, relations: ['pack'], order: { createdAt: 'DESC' } });
  }

  @Get('user/:userId')
  async listByUser(@Param('userId') userId: string) {
    return this.subRepo.find({ where: { userId }, relations: ['pack'], order: { createdAt: 'DESC' } });
  }

  @Get('packs')
  async listPacks() {
    return this.packRepo.find({ where: { isActive: true }, order: { monthlyPrice: 'ASC' } });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.subRepo.findOne({ where: { id }, relations: ['pack'] });
  }
}
