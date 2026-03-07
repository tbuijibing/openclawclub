import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import {
  RequestDataDeletionDto,
  RecordCookieConsentDto,
  UpdateCookieConsentDto,
  ScheduleQuarterlyScanDto,
  ReportVulnerabilityDto,
  TrackRemediationDto,
} from './dto/compliance.dto';

@Controller('compliance')
export class ComplianceServiceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'compliance-service' };
  }

  /* ── Data Deletion (Req 13.4) ── */

  @Post('data-deletion')
  requestDataDeletion(@Body() dto: RequestDataDeletionDto) {
    return this.complianceService.requestDataDeletion(dto);
  }

  @Post('data-deletion/:id/process')
  processDataDeletion(@Param('id') id: string) {
    return this.complianceService.processDataDeletion({ requestId: id });
  }

  @Get('data-deletion/:id')
  getDataDeletionStatus(@Param('id') id: string) {
    return this.complianceService.getDataDeletionStatus({ requestId: id });
  }

  /* ── Cookie Consent (Req 13.7) ── */

  @Post('cookie-consent')
  recordCookieConsent(@Body() dto: RecordCookieConsentDto) {
    return this.complianceService.recordCookieConsent(dto);
  }

  @Get('cookie-consent/:userId')
  getCookieConsent(@Param('userId') userId: string) {
    return this.complianceService.getCookieConsent({ userId });
  }

  @Put('cookie-consent/:userId')
  updateCookieConsent(
    @Param('userId') userId: string,
    @Body() body: { categories: import('@openclaw-club/shared').CookieCategory[] },
  ) {
    return this.complianceService.updateCookieConsent({ userId, categories: body.categories });
  }

  /* ── Data Isolation (Req 8.5) ── */

  @Get('data-region')
  getDataRegion(@Query('countryCode') countryCode: string) {
    return { region: this.complianceService.getDataRegion({ countryCode }) };
  }

  @Post('data-residency')
  assignDataResidency(@Body() body: { userId: string; countryCode: string }) {
    return this.complianceService.assignDataResidency(body.userId, body.countryCode);
  }

  @Post('data-residency/validate')
  validateDataResidency(@Body() body: { userId: string; targetRegion: import('@openclaw-club/shared').DataRegion }) {
    return this.complianceService.validateDataResidency(body);
  }

  /* ── Vulnerability Scanning (Req 13.5) ── */

  @Post('scans')
  scheduleQuarterlyScan(@Body() dto: ScheduleQuarterlyScanDto) {
    return this.complianceService.scheduleQuarterlyScan(dto);
  }

  @Post('scans/:id/execute')
  executeScan(@Param('id') id: string) {
    return this.complianceService.executeScan(id);
  }

  @Post('scans/:id/complete')
  completeScan(@Param('id') id: string) {
    return this.complianceService.completeScan(id);
  }

  @Get('scans/:id/report')
  getVulnerabilityReport(@Param('id') id: string) {
    return this.complianceService.getVulnerabilityReport(id);
  }

  @Post('vulnerabilities')
  reportVulnerability(@Body() dto: ReportVulnerabilityDto) {
    return this.complianceService.reportVulnerability(dto);
  }

  @Put('vulnerabilities/:id/remediation')
  trackRemediation(
    @Param('id') id: string,
    @Body() body: { status: 'in_progress' | 'resolved'; notes?: string },
  ) {
    return this.complianceService.trackRemediation({
      vulnerabilityId: id,
      status: body.status,
      notes: body.notes,
    });
  }
}
