import { Module } from '@nestjs/common';
import { AnalyticsServiceController } from './analytics-service.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalyticsServiceController],
  providers: [AnalyticsService],
})
export class AnalyticsServiceModule {}
