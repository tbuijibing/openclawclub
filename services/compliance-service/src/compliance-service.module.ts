import { Module } from '@nestjs/common';
import { ComplianceServiceController } from './compliance-service.controller';
import { ComplianceService } from './compliance.service';

@Module({
  controllers: [ComplianceServiceController],
  providers: [ComplianceService],
})
export class ComplianceServiceModule {}
