import { Module } from '@nestjs/common';
import { EnterpriseServiceController } from './enterprise-service.controller';
import { OcsasController } from './ocsas.controller';
import { OcsasService } from './ocsas.service';
import { EnterpriseManagementController } from './enterprise-management.controller';
import { EnterpriseManagementService } from './enterprise.service';

@Module({
  controllers: [EnterpriseServiceController, OcsasController, EnterpriseManagementController],
  providers: [OcsasService, EnterpriseManagementService],
})
export class EnterpriseServiceModule {}
