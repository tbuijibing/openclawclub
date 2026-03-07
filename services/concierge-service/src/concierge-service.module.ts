import { Module } from '@nestjs/common';
import { ConciergeServiceController } from './concierge-service.controller';
import { ConciergeService } from './concierge.service';
import { TokenHubClient } from './token-hub.client';

@Module({
  controllers: [ConciergeServiceController],
  providers: [ConciergeService, TokenHubClient],
  exports: [ConciergeService],
})
export class ConciergeServiceModule {}
