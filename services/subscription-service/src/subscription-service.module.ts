import { Module } from '@nestjs/common';
import { SubscriptionServiceController } from './subscription-service.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionServiceController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionServiceModule {}
