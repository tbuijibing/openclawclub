import { Module } from '@nestjs/common';
import { InstallServiceController } from './install-service.controller';
import { InstallService } from './install.service';
import { DispatchService } from './dispatch.service';

@Module({
  controllers: [InstallServiceController],
  providers: [InstallService, DispatchService],
  exports: [InstallService, DispatchService],
})
export class InstallServiceModule {}
