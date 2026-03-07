import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstallOrder } from '../../../../packages/database/src/entities/install-order.entity';
import { DeliveryReport } from '../../../../packages/database/src/entities/delivery-report.entity';
import { ServiceReview } from '../../../../packages/database/src/entities/service-review.entity';

@Controller('installations')
export class DbInstallController {
  constructor(
    @InjectRepository(InstallOrder) private installRepo: Repository<InstallOrder>,
    @InjectRepository(DeliveryReport) private reportRepo: Repository<DeliveryReport>,
    @InjectRepository(ServiceReview) private reviewRepo: Repository<ServiceReview>,
  ) {}

  @Get()
  async list(@Query('status') status?: string, @Query('engineerId') engineerId?: string) {
    const qb = this.installRepo.createQueryBuilder('i')
      .leftJoinAndSelect('i.order', 'o')
      .orderBy('o.createdAt', 'DESC');
    if (status) qb.andWhere('i.installStatus = :status', { status });
    if (engineerId) qb.andWhere('i.engineerId = :engineerId', { engineerId });
    return qb.getMany();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.installRepo.findOne({
      where: { id },
      relations: ['order', 'engineer', 'deliveryReport'],
    });
  }

  @Get(':id/delivery-report')
  async getReport(@Param('id') installOrderId: string) {
    return this.reportRepo.findOne({ where: { installOrderId } });
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    const install = await this.installRepo.findOne({ where: { id } });
    if (!install) return [];
    return this.reviewRepo.find({ where: { orderId: install.orderId } });
  }
}
