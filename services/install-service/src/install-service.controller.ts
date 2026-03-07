import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { InstallService } from './install.service';
import { DispatchService } from './dispatch.service';
import {
  CreateInstallOrderDto,
  UpdateInstallProgressDto,
  AcceptOrderDto,
  SubmitDeliveryReportDto,
  ConfirmAcceptanceDto,
  SubmitReviewDto,
  RequestWarrantyRepairDto,
} from './dto/install.dto';
import { InstallStatus, ExternalPlatform } from '@openclaw-club/shared';

@Controller('installations')
export class InstallServiceController {
  constructor(
    private readonly installService: InstallService,
    private readonly dispatchService: DispatchService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'install-service' };
  }

  /* ── Service Tiers ── */

  @Get('tiers')
  getServiceTiers() {
    return this.installService.getServiceTiers();
  }

  @Get('tiers/:tier')
  getServiceTier(@Param('tier') tier: string) {
    return this.installService.getServiceTier(tier as any);
  }

  /* ── Install Orders ── */

  @Post('orders')
  createInstallOrder(@Body() dto: CreateInstallOrderDto) {
    return this.installService.createInstallOrder(dto);
  }

  @Get('orders/:id')
  getInstallOrder(@Param('id') id: string) {
    return this.installService.getInstallOrder(id);
  }

  @Get('orders')
  listOrders(@Query('userId') userId?: string, @Query('engineerId') engineerId?: string) {
    if (engineerId) return this.installService.listByEngineer(engineerId);
    if (userId) return this.installService.listByUser(userId);
    return [];
  }

  @Patch('orders/:id/progress')
  updateProgress(@Param('id') id: string, @Body() dto: UpdateInstallProgressDto) {
    return this.installService.updateProgress(id, dto.status as InstallStatus);
  }

  @Post('orders/:id/accept')
  acceptOrder(@Param('id') id: string, @Body() dto: AcceptOrderDto) {
    return this.installService.acceptOrder(id, dto.engineerId);
  }

  /* ── Dispatch ── */

  @Post('orders/:id/dispatch')
  dispatchOrder(@Param('id') id: string, @Body() body: { userTimezone?: string }) {
    return this.dispatchService.dispatchOrder(id, body.userTimezone);
  }

  @Post('orders/:id/dispatch/escalate')
  escalateDispatch(@Param('id') id: string, @Body() body: { level: string }) {
    return this.dispatchService.escalateDispatch(id, body.level as any);
  }

  @Post('orders/:id/dispatch/external')
  routeToExternal(@Param('id') id: string, @Body() body: { platform: ExternalPlatform }) {
    return this.dispatchService.routeToExternalPlatform(id, body.platform);
  }

  @Post('dispatch/process-timeouts')
  processDispatchTimeouts() {
    return this.dispatchService.processDispatchTimeouts();
  }

  /* ── Delivery & Acceptance ── */

  @Post('orders/:id/delivery-report')
  submitDeliveryReport(@Param('id') id: string, @Body() dto: SubmitDeliveryReportDto) {
    return this.installService.submitDeliveryReport(id, dto.engineerId, {
      checklist: dto.checklist,
      configItems: dto.configItems,
      testResults: dto.testResults,
      screenshots: dto.screenshots,
    });
  }

  @Get('orders/:id/delivery-report')
  getDeliveryReport(@Param('id') id: string) {
    return this.installService.getDeliveryReport(id);
  }

  @Post('orders/:id/accept-delivery')
  confirmAcceptance(@Param('id') id: string, @Body() dto: ConfirmAcceptanceDto) {
    return this.installService.confirmAcceptance(id, dto.userId);
  }

  @Post('auto-acceptance')
  processAutoAcceptance() {
    return this.installService.processAutoAcceptance();
  }

  /* ── Reviews ── */

  @Post('orders/:id/review')
  submitReview(@Param('id') id: string, @Body() dto: SubmitReviewDto) {
    return this.installService.submitReview(id, dto.userId, {
      overallRating: dto.overallRating,
      attitudeRating: dto.attitudeRating,
      skillRating: dto.skillRating,
      responseRating: dto.responseRating,
      comment: dto.comment,
    });
  }

  /* ── Warranty ── */

  @Post('orders/:id/warranty-repair')
  requestWarrantyRepair(@Param('id') id: string, @Body() dto: RequestWarrantyRepairDto) {
    return this.installService.requestWarrantyRepair(id, dto.userId, dto.issue);
  }

  @Get('orders/:id/warranty-tickets')
  getWarrantyTickets(@Param('id') id: string) {
    return this.installService.getWarrantyTickets(id);
  }
}
