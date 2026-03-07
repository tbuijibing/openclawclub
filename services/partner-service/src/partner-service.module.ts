import { Module } from '@nestjs/common';
import { PartnerServiceController } from './partner-service.controller';
import { PartnerService } from './partner.service';

@Module({
  controllers: [PartnerServiceController],
  providers: [PartnerService],
})
export class PartnerServiceModule {}
