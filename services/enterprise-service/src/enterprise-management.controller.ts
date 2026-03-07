import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { EnterpriseManagementService } from './enterprise.service';
import {
  SubmitCustomDevRequestDto,
  ConfirmCustomDevDto,
  AssignTeamDto,
  ActivateManagedServiceDto,
  GenerateOpsReportDto,
  RequestConsultingDto,
  CreateIntegrationDto,
  RequestSlaCompensationDto,
} from './dto/enterprise.dto';

@Controller('enterprise')
export class EnterpriseManagementController {
  constructor(private readonly enterpriseService: EnterpriseManagementService) {}

  // ─── Custom Development (Req 5.1, 5.2) ───

  @Post('custom-dev/request')
  submitCustomDevRequest(@Body() dto: SubmitCustomDevRequestDto) {
    return this.enterpriseService.submitCustomDevRequest(dto);
  }

  @Post('custom-dev/quote/:requestId')
  provideQuote(
    @Param('requestId') requestId: string,
    @Body('quotedAmount') quotedAmount: number,
  ) {
    return this.enterpriseService.provideQuote(requestId, quotedAmount);
  }

  @Post('custom-dev/confirm')
  confirmAndCreateProject(@Body() dto: ConfirmCustomDevDto) {
    return this.enterpriseService.confirmAndCreateProject(dto);
  }

  @Get('custom-dev/request/:requestId')
  getCustomDevRequest(@Param('requestId') requestId: string) {
    return this.enterpriseService.getCustomDevRequest(requestId);
  }

  // ─── Projects (Req 5.2) ───

  @Post('projects/assign-team')
  assignTeam(@Body() dto: AssignTeamDto) {
    return this.enterpriseService.assignTeam(dto);
  }

  @Get('projects/:projectId')
  getProject(@Param('projectId') projectId: string) {
    return this.enterpriseService.getProject(projectId);
  }

  // ─── Managed Services (Req 5.3, 5.4) ───

  @Post('managed-services/activate')
  activateManagedService(@Body() dto: ActivateManagedServiceDto) {
    return this.enterpriseService.activateManagedService(dto);
  }

  @Get('managed-services/:id')
  getManagedService(@Param('id') id: string) {
    return this.enterpriseService.getManagedService(id);
  }

  @Post('managed-services/ops-report')
  generateOpsReport(@Body() dto: GenerateOpsReportDto) {
    return this.enterpriseService.generateOpsReport(dto);
  }

  @Get('ops-reports/:reportId')
  getOpsReport(@Param('reportId') reportId: string) {
    return this.enterpriseService.getOpsReport(reportId);
  }

  // ─── Consulting (Req 5.5) ───

  @Post('consulting/request')
  requestConsulting(@Body() dto: RequestConsultingDto) {
    return this.enterpriseService.requestConsulting(dto);
  }

  @Get('consulting/:id')
  getConsultingEngagement(@Param('id') id: string) {
    return this.enterpriseService.getConsultingEngagement(id);
  }

  @Post('consulting/:id/deliver')
  deliverConsulting(
    @Param('id') id: string,
    @Body('deliverables') deliverables: string[],
  ) {
    return this.enterpriseService.deliverConsulting(id, deliverables);
  }

  // ─── Integration API (Req 5.6) ───

  @Post('integrations')
  createIntegration(@Body() dto: CreateIntegrationDto) {
    return this.enterpriseService.createIntegration(dto);
  }

  @Get('integrations/:id')
  getIntegration(@Param('id') id: string) {
    return this.enterpriseService.getIntegration(id);
  }

  @Get('integrations')
  listIntegrations(@Query('enterpriseUserId') enterpriseUserId: string) {
    return this.enterpriseService.listIntegrations(enterpriseUserId);
  }

  // ─── SLA Compensation (Req 5.7) ───

  @Post('sla/compensation')
  requestSlaCompensation(@Body() dto: RequestSlaCompensationDto) {
    return this.enterpriseService.requestSlaCompensation(dto);
  }

  @Get('sla/compensation/:id')
  getSlaCompensation(@Param('id') id: string) {
    return this.enterpriseService.getSlaCompensation(id);
  }
}
