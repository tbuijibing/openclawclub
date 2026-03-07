import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../../packages/database/src/entities/order.entity';
import { User } from '../../../../packages/database/src/entities/user.entity';
import { Ticket } from '../../../../packages/database/src/entities/ticket.entity';
import { InstallOrder } from '../../../../packages/database/src/entities/install-order.entity';
import { TokenUsageRecord } from '../../../../packages/database/src/entities/token-usage-record.entity';
import { Subscription } from '../../../../packages/database/src/entities/subscription.entity';

@Controller('analytics')
export class DbAnalyticsController {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectRepository(InstallOrder) private installRepo: Repository<InstallOrder>,
    @InjectRepository(TokenUsageRecord) private usageRepo: Repository<TokenUsageRecord>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
  ) {}

  @Get('dashboard')
  async dashboard() {
    const [totalUsers, totalOrders, activeTickets, activeSubs] = await Promise.all([
      this.userRepo.count(),
      this.orderRepo.count(),
      this.ticketRepo.count({ where: { status: 'open' } }),
      this.subRepo.count({ where: { status: 'active' } }),
    ]);

    const revenue = await this.orderRepo.createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'total')
      .where("o.status IN ('completed', 'shipped')")
      .getRawOne();

    const ordersByType = await this.orderRepo.createQueryBuilder('o')
      .select('o.orderType', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(o.totalAmount)', 'revenue')
      .groupBy('o.orderType')
      .getRawMany();

    const usersByRegion = await this.userRepo.createQueryBuilder('u')
      .select('u.region', 'region')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.region')
      .getRawMany();

    return {
      totalUsers, totalOrders, activeTickets, activeSubs,
      totalRevenue: revenue?.total || 0,
      ordersByType, usersByRegion,
    };
  }
}
