import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { OcsasService } from './ocsas.service';
import { ApplySecurityConfigDto, GenerateAuditReportDto, ScanVulnerabilitiesDto } from './dto/ocsas.dto';
import type { OcsasLevel } from '@openclaw-club/shared';

@Controller('ocsas')
export class OcsasController {
  constructor(private readonly ocsasService: OcsasService) {}

  @Get('levels')
  getLevels() {
    return this.ocsasService.getLevels();
  }

  @Get('levels/:level')
  getLevel(@Param('level', ParseIntPipe) level: number) {
    return this.ocsasService.getLevel(level as OcsasLevel);
  }

  @Post('apply')
  applySecurityConfig(@Body() dto: ApplySecurityConfigDto) {
    return this.ocsasService.applySecurityConfig(dto);
  }

  @Get('config/:instanceId')
  getAppliedConfig(@Param('instanceId') instanceId: string) {
    return this.ocsasService.getAppliedConfig(instanceId);
  }

  @Post('audit-report')
  generateAuditReport(@Body() dto: GenerateAuditReportDto) {
    return this.ocsasService.generateAuditReport(dto);
  }

  @Get('audit-report/:reportId')
  getAuditReport(@Param('reportId') reportId: string) {
    return this.ocsasService.getAuditReport(reportId);
  }

  @Post('scan')
  scanVulnerabilities(@Body() dto: ScanVulnerabilitiesDto) {
    return this.ocsasService.scanVulnerabilities(dto);
  }

  @Get('notifications/:instanceId')
  listNotifications(@Param('instanceId') instanceId: string) {
    return this.ocsasService.listNotifications(instanceId);
  }
}
