import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  SubscribeDto,
  DeployPackDto,
  ProcessAutoRenewalDto,
  CancelSubscriptionDto,
  PushUpdateDto,
} from './dto/subscription.dto';

@Controller('subscriptions')
export class SubscriptionServiceController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'subscription-service' };
  }

  /** Get all available configuration packs (Req 3.1) */
  @Get('packs')
  getConfigurationPacks() {
    return this.subscriptionService.getConfigurationPacks();
  }

  /** Get a specific configuration pack */
  @Get('packs/:id')
  getConfigPack(@Param('id') id: string) {
    return this.subscriptionService.getConfigPack(id);
  }

  /** Create a subscription (Req 3.2, 3.3) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  subscribe(@Body() dto: SubscribeDto) {
    const subscription = this.subscriptionService.subscribe(dto.userId, dto.packId, dto.cycle);
    // Immediately deploy the pack (Req 3.2)
    const deployResult = this.subscriptionService.deployPack(subscription.id);
    return { subscription, deployResult };
  }

  /** Deploy a configuration pack for an existing subscription */
  @Post(':id/deploy')
  deploy(@Param('id') id: string) {
    return this.subscriptionService.deployPack(id);
  }

  /** Process auto-renewal for a subscription (Req 3.3) */
  @Post(':id/renew')
  processAutoRenewal(@Param('id') id: string) {
    return this.subscriptionService.processAutoRenewal(id);
  }

  /** Cancel a subscription (Req 3.5) */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelSubscription(@Param('id') id: string) {
    this.subscriptionService.cancelSubscription(id);
  }

  /** Push configuration pack update (Req 3.6) */
  @Post('packs/:packId/update')
  pushUpdate(@Param('packId') packId: string, @Body() dto: PushUpdateDto) {
    return this.subscriptionService.pushUpdate(packId, dto.version);
  }

  /** Get subscriptions due for renewal reminder (Req 3.4) */
  @Get('reminders/due')
  getRenewalReminders() {
    return this.subscriptionService.getSubscriptionsDueForReminder();
  }

  /** Get a specific subscription */
  @Get(':id')
  getSubscription(@Param('id') id: string) {
    return this.subscriptionService.getSubscription(id);
  }

  /** List subscriptions for a user */
  @Get('user/:userId')
  listByUser(@Param('userId') userId: string) {
    return this.subscriptionService.listByUser(userId);
  }

  /** Get deploy error logs for a subscription */
  @Get(':id/errors')
  getDeployErrors(@Param('id') id: string) {
    return this.subscriptionService.getDeployErrors(id);
  }
}
