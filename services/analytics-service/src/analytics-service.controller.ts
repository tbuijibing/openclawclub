import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import type { AnalyticsRegion, ReportPeriod, ExportFormat } from '@openclaw-club/shared';
import {
  GenerateReportDto,
  RecordMetricDto,
} from './dto/analytics.dto';

@Controller('analytics')
export class AnalyticsServiceController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'analytics-service' };
  }

  /* ── Dashboard (Req 12.1) ── */

  @Get('dashboard')
  getDashboard(@Query('region') region?: AnalyticsRegion) {
    return this.analyticsService.getDashboard({ region });
  }

  /* ── Reports (Req 12.2, 12.3) ── */

  @Post('reports')
  generateReport(@Body() dto: GenerateReportDto) {
    return this.analyticsService.generateReport(dto);
  }

  @Get('reports/:id')
  getReport(@Param('id') id: string) {
    return this.analyticsService.getReport(id);
  }

  @Get('reports/:id/export')
  exportReport(@Param('id') id: string, @Query('format') format: ExportFormat) {
    return this.analyticsService.exportReport({ reportId: id, format });
  }

  /* ── Regional Stats (Req 12.4) ── */

  @Get('regions')
  getAllRegionalStats() {
    return this.analyticsService.getAllRegionalStats();
  }

  @Get('regions/:region')
  getRegionalStats(@Param('region') region: AnalyticsRegion) {
    return this.analyticsService.getRegionalStats({ region });
  }

  /* ── Conversion Funnel (Req 12.5) ── */

  @Get('funnel')
  getConversionFunnel(
    @Query('region') region?: AnalyticsRegion,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getConversionFunnel({ region, startDate, endDate });
  }

  /* ── Metrics & Anomalies (Req 12.6) ── */

  @Post('metrics')
  recordMetric(@Body() dto: RecordMetricDto) {
    return this.analyticsService.recordMetric(dto);
  }

  @Post('anomalies/check')
  checkAnomalies(@Body() body: { date: string }) {
    return this.analyticsService.checkAnomalies({ date: body.date });
  }

  @Get('anomalies')
  getAnomalyAlerts() {
    return this.analyticsService.getAnomalyAlerts();
  }
}
