import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../packages/database/src/entities/user.entity';
import { EnterpriseInfo } from '../../../../packages/database/src/entities/enterprise-info.entity';
import { Organization } from '../../../../packages/database/src/entities/organization.entity';

@Controller('users')
export class DbUserController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(EnterpriseInfo) private entRepo: Repository<EnterpriseInfo>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
  ) {}

  @Get()
  async list(@Query('page') page = '1', @Query('limit') limit = '20') {
    const [items, total] = await this.userRepo.findAndCount({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      order: { createdAt: 'DESC' },
    });
    return { items, total, page: Number(page), limit: Number(limit) };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.userRepo.findOne({ where: { id }, relations: ['enterpriseInfo'] });
  }

  @Get(':id/enterprise-info')
  async getEnterpriseInfo(@Param('id') userId: string) {
    return this.entRepo.findOne({ where: { userId } });
  }

  @Get('organizations/list')
  async listOrgs() {
    return this.orgRepo.find({ order: { createdAt: 'DESC' } });
  }
}
