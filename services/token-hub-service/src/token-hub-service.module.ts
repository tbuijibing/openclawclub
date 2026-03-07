import { Module } from '@nestjs/common';
import { TokenHubServiceController } from './token-hub-service.controller';
import { TokenHubService } from './token-hub.service';
import { RoutingService } from './routing.service';
import { BillingService } from './billing.service';
import { AuditService } from './audit.service';
import { UserKeyService } from './user-key.service';
import { BillingController } from './billing.controller';
import { AI_PROVIDERS, createDefaultProviders } from './providers';

@Module({
  controllers: [TokenHubServiceController, BillingController],
  providers: [
    TokenHubService,
    RoutingService,
    BillingService,
    AuditService,
    UserKeyService,
    {
      provide: AI_PROVIDERS,
      useFactory: () => createDefaultProviders(),
    },
  ],
  exports: [TokenHubService, RoutingService, BillingService, AuditService, UserKeyService],
})
export class TokenHubServiceModule {}
