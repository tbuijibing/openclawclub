import { Module } from '@nestjs/common';
import { HardwareServiceController } from './hardware-service.controller';
import { HardwareService } from './hardware.service';

@Module({
  controllers: [HardwareServiceController],
  providers: [HardwareService],
})
export class HardwareServiceModule {}
