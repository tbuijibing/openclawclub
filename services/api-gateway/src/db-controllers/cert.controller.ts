import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../../../../packages/database/src/entities/certificate.entity';

@Controller('certifications')
export class DbCertController {
  constructor(
    @InjectRepository(Certificate) private certRepo: Repository<Certificate>,
  ) {}

  @Get()
  async list(@Query('userId') userId?: string, @Query('status') status?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    return this.certRepo.find({ where, order: { issuedAt: 'DESC' } });
  }

  @Get('certificates/user/:userId')
  async listByUser(@Param('userId') userId: string) {
    return this.certRepo.find({ where: { userId }, order: { issuedAt: 'DESC' } });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.certRepo.findOne({ where: { id } });
  }

  @Get('verify/:certNumber')
  async verify(@Param('certNumber') certNumber: string) {
    const cert = await this.certRepo.findOne({ where: { certNumber } });
    if (!cert) return { valid: false };
    return { valid: cert.status === 'active' && new Date(cert.expiresAt) > new Date(), cert };
  }
}
