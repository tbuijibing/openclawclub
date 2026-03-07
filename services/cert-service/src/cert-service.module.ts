import { Module } from '@nestjs/common';
import { CertServiceController } from './cert-service.controller';
import { CertificationService } from './certification.service';

@Module({
  controllers: [CertServiceController],
  providers: [CertificationService],
  exports: [CertificationService],
})
export class CertServiceModule {}
