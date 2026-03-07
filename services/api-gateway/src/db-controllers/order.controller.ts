import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../../packages/database/src/entities/order.entity';
import { Payment } from '../../../../packages/database/src/entities/payment.entity';

@Controller('orders')
export class DbOrderController {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
  ) {}

  @Get()
  async list(
    @Query('page') page = '1', @Query('limit') limit = '20',
    @Query('status') status?: string, @Query('userId') userId?: string,
  ) {
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.payment', 'p')
      .orderBy('o.createdAt', 'DESC');
    if (status) qb.andWhere('o.status = :status', { status });
    if (userId) qb.andWhere('o.userId = :userId', { userId });
    const [items, total] = await qb
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getManyAndCount();
    return { items, total, page: Number(page), limit: Number(limit) };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.orderRepo.findOne({
      where: { id },
      relations: ['payment', 'installOrder', 'user'],
    });
  }

  @Get(':id/payment')
  async getPayment(@Param('id') orderId: string) {
    return this.paymentRepo.findOne({ where: { orderId } });
  }
}
