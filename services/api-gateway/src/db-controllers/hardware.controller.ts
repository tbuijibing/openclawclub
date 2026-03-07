import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HardwareProduct } from '../../../../packages/database/src/entities/hardware-product.entity';

@Controller('hardware')
export class DbHardwareController {
  constructor(
    @InjectRepository(HardwareProduct) private hwRepo: Repository<HardwareProduct>,
  ) {}

  @Get('products')
  async list(@Query('category') category?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    return this.hwRepo.find({ where, order: { price: 'ASC' } });
  }

  @Get('products/:id')
  async getById(@Param('id') id: string) {
    return this.hwRepo.findOne({ where: { id } });
  }
}
