import { Module } from '@nestjs/common';
import { IntegrationServiceController } from './integration-service.controller';
import { IntegrationService } from './integration.service';

@Module({
  controllers: [IntegrationServiceController],
  providers: [IntegrationService],
})
export class IntegrationServiceModule {}
