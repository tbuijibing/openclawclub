import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuditService } from './audit.service';
import { UserKeyService } from './user-key.service';
import {
  MeterUsageDto,
  PurchaseQuotaDto,
  SetEnterpriseQuotaDto,
  UsageDashboardQueryDto,
} from './dto/billing.dto';
import { AddApiKeyDto, SwitchModeDto, AuditLogQueryDto } from './dto/user-key.dto';

@Controller('token-hub')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly auditService: AuditService,
    private readonly userKeyService: UserKeyService,
  ) {}

  // ── Billing endpoints ──

  @Post('users/:userId/usage')
  meterUsage(@Param('userId') userId: string, @Body() dto: MeterUsageDto) {
    return this.billingService.meterUsage(userId, dto);
  }

  @Post('users/:userId/quota/purchase')
  purchaseQuota(@Param('userId') userId: string, @Body() dto: PurchaseQuotaDto) {
    return this.billingService.purchaseQuota(userId, dto);
  }

  @Post('users/:userId/quota/enterprise')
  setEnterpriseQuota(@Param('userId') userId: string, @Body() dto: SetEnterpriseQuotaDto) {
    return this.billingService.setEnterpriseQuota(userId, dto);
  }

  @Get('users/:userId/dashboard')
  getUsageDashboard(
    @Param('userId') userId: string,
    @Query() query: UsageDashboardQueryDto,
  ) {
    return this.billingService.getUsageDashboard(userId, query.startDate, query.endDate);
  }

  // ── Audit log endpoints (req 15.10) ──

  @Get('users/:userId/audit-logs')
  getAuditLogs(
    @Param('userId') userId: string,
    @Query() query: AuditLogQueryDto,
  ) {
    return this.auditService.getAuditLogs(userId, query.startDate, query.endDate);
  }

  // ── User API key management endpoints (req 15.9) ──

  @Post('users/:userId/api-keys')
  addApiKey(@Param('userId') userId: string, @Body() dto: AddApiKeyDto) {
    return this.userKeyService.addApiKey(userId, dto.provider, dto.apiKey);
  }

  @Get('users/:userId/api-keys')
  listApiKeys(@Param('userId') userId: string) {
    return this.userKeyService.listApiKeys(userId);
  }

  @Delete('users/:userId/api-keys/:keyId')
  removeApiKey(@Param('userId') userId: string, @Param('keyId') keyId: string) {
    this.userKeyService.removeApiKey(userId, keyId);
    return { success: true };
  }

  @Post('users/:userId/key-mode')
  switchMode(@Param('userId') userId: string, @Body() dto: SwitchModeDto) {
    return this.userKeyService.switchMode(userId, dto.mode);
  }

  @Get('users/:userId/key-mode')
  getMode(@Param('userId') userId: string) {
    return { userId, mode: this.userKeyService.getMode(userId) };
  }
}
