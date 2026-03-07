import { Controller, Get } from '@nestjs/common';

@Controller('enterprise')
export class EnterpriseServiceController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'enterprise-service' };
  }
}
