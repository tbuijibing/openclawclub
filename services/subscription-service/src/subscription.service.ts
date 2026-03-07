import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  CONFIGURATION_PACKS,
  YEARLY_MONTHS_CHARGED,
  RENEWAL_REMINDER_DAYS,
  DATA_RETENTION_DAYS,
  type PackCategory,
  type PackDefinition,
  type SubscriptionCycle,
  type SubscriptionStatus,
  type DeployStatus,
} from '@openclaw-club/shared';

/** In-memory configuration pack record */
export interface ConfigPackRecord {
  id: string;
  name: string;
  category: PackCategory;
  monthlyPrice: number;
  features: string[];
  version: string;
  isActive: boolean;
  createdAt: Date;
}

/** In-memory subscription record */
export interface SubscriptionRecord {
  id: string;
  userId: string;
  packId: string;
  orderId: string;
  cycle: SubscriptionCycle;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  autoRenew: boolean;
  cancelledAt?: Date;
  dataRetentionUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Deploy result */
export interface DeployResult {
  subscriptionId: string;
  packId: string;
  status: DeployStatus;
  deployedAt?: Date;
  error?: string;
}

/** Renewal result */
export interface RenewalResult {
  subscriptionId: string;
  renewed: boolean;
  newPeriodStart?: Date;
  newPeriodEnd?: Date;
  amountCharged?: number;
  error?: string;
}

/** Update result */
export interface UpdateResult {
  packId: string;
  version: string;
  subscribersNotified: number;
  failures: string[];
}

/** Deploy error log entry */
export interface DeployErrorLog {
  id: string;
  subscriptionId: string;
  packId: string;
  error: string;
  techSupportNotified: boolean;
  userNotified: boolean;
  createdAt: Date;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  /** In-memory stores — will be replaced by TypeORM repositories */
  private packs = new Map<string, ConfigPackRecord>();
  private subscriptions = new Map<string, SubscriptionRecord>();
  private deployErrorLogs = new Map<string, DeployErrorLog>();

  /** Simulate deploy failure for testing */
  private simulateDeployFailure = false;

  constructor() {
    this.seedConfigurationPacks();
  }

  /**
   * Seed the three configuration packs from shared constants.
   */
  private seedConfigurationPacks(): void {
    for (const [category, def] of Object.entries(CONFIGURATION_PACKS)) {
      const pack: ConfigPackRecord = {
        id: crypto.randomUUID(),
        name: def.name,
        category: category as PackCategory,
        monthlyPrice: def.monthlyPrice,
        features: def.features,
        version: '1.0.0',
        isActive: true,
        createdAt: new Date(),
      };
      this.packs.set(pack.id, pack);
    }
  }

  /**
   * Get all active configuration packs.
   */
  getConfigurationPacks(): ConfigPackRecord[] {
    return Array.from(this.packs.values()).filter((p) => p.isActive);
  }

  /**
   * Get a configuration pack by ID.
   */
  getConfigPack(packId: string): ConfigPackRecord {
    const pack = this.packs.get(packId);
    if (!pack) throw new NotFoundException(`Configuration pack ${packId} not found`);
    return pack;
  }

  /**
   * Get a configuration pack by category.
   */
  getPackByCategory(category: PackCategory): ConfigPackRecord | undefined {
    return Array.from(this.packs.values()).find((p) => p.category === category && p.isActive);
  }

  /**
   * Calculate subscription price based on cycle.
   * Yearly = 10 months price (2 months free).
   */
  calculatePrice(monthlyPrice: number, cycle: SubscriptionCycle): number {
    if (cycle === 'yearly') {
      return monthlyPrice * YEARLY_MONTHS_CHARGED;
    }
    return monthlyPrice;
  }

  /**
   * Calculate period end date based on cycle and start date.
   */
  calculatePeriodEnd(start: Date, cycle: SubscriptionCycle): Date {
    const end = new Date(start);
    if (cycle === 'yearly') {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    return end;
  }

  /**
   * Create a subscription (Req 3.1, 3.2, 3.3).
   */
  subscribe(userId: string, packId: string, cycle: SubscriptionCycle): SubscriptionRecord {
    const pack = this.getConfigPack(packId);
    if (!pack.isActive) {
      throw new BadRequestException('Configuration pack is not active');
    }

    // Check for existing active subscription to the same pack
    const existing = Array.from(this.subscriptions.values()).find(
      (s) => s.userId === userId && s.packId === packId && s.status === 'active',
    );
    if (existing) {
      throw new BadRequestException('User already has an active subscription to this pack');
    }

    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, cycle);
    const orderId = crypto.randomUUID(); // In production: call OrderService.createOrder

    const subscription: SubscriptionRecord = {
      id: crypto.randomUUID(),
      userId,
      packId,
      orderId,
      cycle,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      autoRenew: true,
      createdAt: now,
      updatedAt: now,
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  /**
   * Deploy configuration pack to user's OpenClaw instance (Req 3.2).
   * On failure: logs error, notifies tech support, notifies user (Req 3.7).
   */
  deployPack(subscriptionId: string): DeployResult {
    const sub = this.getSubscription(subscriptionId);
    if (sub.status !== 'active') {
      throw new BadRequestException('Subscription is not active');
    }

    const pack = this.getConfigPack(sub.packId);

    if (this.simulateDeployFailure) {
      const errorLog = this.logDeployError(subscriptionId, pack.id, 'Simulated deployment failure');
      return {
        subscriptionId,
        packId: pack.id,
        status: 'failed',
        error: errorLog.error,
      };
    }

    return {
      subscriptionId,
      packId: pack.id,
      status: 'success',
      deployedAt: new Date(),
    };
  }

  /**
   * Log a deployment error and notify tech support + user (Req 3.7).
   */
  private logDeployError(subscriptionId: string, packId: string, error: string): DeployErrorLog {
    const log: DeployErrorLog = {
      id: crypto.randomUUID(),
      subscriptionId,
      packId,
      error,
      techSupportNotified: true,
      userNotified: true,
      createdAt: new Date(),
    };
    this.deployErrorLogs.set(log.id, log);
    this.logger.error(`Deploy failed for subscription ${subscriptionId}: ${error}`);
    // In production: call NotificationService to notify tech support and user
    return log;
  }

  /**
   * Process auto-renewal for a subscription (Req 3.3).
   */
  processAutoRenewal(subscriptionId: string): RenewalResult {
    const sub = this.getSubscription(subscriptionId);

    if (sub.status !== 'active') {
      return { subscriptionId, renewed: false, error: 'Subscription is not active' };
    }

    if (!sub.autoRenew) {
      // Auto-renew disabled — expire the subscription
      sub.status = 'expired';
      sub.updatedAt = new Date();
      return { subscriptionId, renewed: false, error: 'Auto-renewal is disabled' };
    }

    const pack = this.packs.get(sub.packId);
    if (!pack) {
      return { subscriptionId, renewed: false, error: 'Configuration pack not found' };
    }

    // In production: call PaymentService to charge the user
    const amount = this.calculatePrice(pack.monthlyPrice, sub.cycle);

    const newStart = new Date(sub.currentPeriodEnd);
    const newEnd = this.calculatePeriodEnd(newStart, sub.cycle);

    sub.currentPeriodStart = newStart;
    sub.currentPeriodEnd = newEnd;
    sub.updatedAt = new Date();

    return {
      subscriptionId,
      renewed: true,
      newPeriodStart: newStart,
      newPeriodEnd: newEnd,
      amountCharged: amount,
    };
  }

  /**
   * Cancel a subscription (Req 3.5).
   * Retains data for DATA_RETENTION_DAYS (30 days).
   */
  cancelSubscription(subscriptionId: string): void {
    const sub = this.getSubscription(subscriptionId);

    if (sub.status === 'cancelled') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const now = new Date();
    sub.status = 'cancelled';
    sub.autoRenew = false;
    sub.cancelledAt = now;
    sub.dataRetentionUntil = new Date(now.getTime() + DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    sub.updatedAt = now;
  }

  /**
   * Push configuration pack update to all active subscribers (Req 3.6).
   */
  pushUpdate(packId: string, version: string): UpdateResult {
    const pack = this.getConfigPack(packId);
    pack.version = version;

    const activeSubscribers = Array.from(this.subscriptions.values()).filter(
      (s) => s.packId === packId && s.status === 'active',
    );

    const failures: string[] = [];
    let notified = 0;

    for (const sub of activeSubscribers) {
      const deployResult = this.deployPack(sub.id);
      if (deployResult.status === 'success') {
        notified++;
      } else {
        failures.push(sub.id);
      }
    }

    return {
      packId,
      version,
      subscribersNotified: notified,
      failures,
    };
  }

  /**
   * Get subscriptions that are due for renewal reminder (Req 3.4).
   * Returns subscriptions expiring within RENEWAL_REMINDER_DAYS.
   */
  getSubscriptionsDueForReminder(): SubscriptionRecord[] {
    const now = new Date();
    const reminderCutoff = new Date(now.getTime() + RENEWAL_REMINDER_DAYS * 24 * 60 * 60 * 1000);

    return Array.from(this.subscriptions.values()).filter(
      (s) =>
        s.status === 'active' &&
        s.currentPeriodEnd <= reminderCutoff &&
        s.currentPeriodEnd > now,
    );
  }

  /**
   * Get expired subscriptions that should be marked as expired.
   */
  processExpiredSubscriptions(): SubscriptionRecord[] {
    const now = new Date();
    const expired: SubscriptionRecord[] = [];

    for (const sub of this.subscriptions.values()) {
      if (sub.status === 'active' && sub.currentPeriodEnd <= now) {
        sub.status = 'expired';
        sub.updatedAt = now;
        expired.push(sub);
      }
    }

    return expired;
  }

  /**
   * Get a subscription by ID.
   */
  getSubscription(id: string): SubscriptionRecord {
    const sub = this.subscriptions.get(id);
    if (!sub) throw new NotFoundException(`Subscription ${id} not found`);
    return sub;
  }

  /**
   * List subscriptions for a user.
   */
  listByUser(userId: string): SubscriptionRecord[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.userId === userId);
  }

  /**
   * Get deploy error logs for a subscription.
   */
  getDeployErrors(subscriptionId: string): DeployErrorLog[] {
    return Array.from(this.deployErrorLogs.values()).filter(
      (l) => l.subscriptionId === subscriptionId,
    );
  }

  /** Enable/disable deploy failure simulation (for testing) */
  setSimulateDeployFailure(value: boolean): void {
    this.simulateDeployFailure = value;
  }
}
