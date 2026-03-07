import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import type { BillingMode } from '@openclaw-club/shared';
import type {
  MeterUsageDto,
  PurchaseQuotaDto,
  SetEnterpriseQuotaDto,
  UsageDashboardResponse,
  ModelUsageSummary,
  DailyUsage,
} from './dto/billing.dto';

/** In-memory token account for development (replace with TypeORM repository in production) */
export interface TokenAccountRecord {
  id: string;
  userId: string;
  balanceUsd: number;
  billingMode: BillingMode;
  monthlyQuotaUsd: number | null;
  budgetAlertThreshold: number | null;
}

/** In-memory usage record */
export interface UsageRecord {
  id: string;
  accountId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  priceUsd: number;
  createdAt: Date;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  // In-memory stores (replace with TypeORM repositories in production)
  private accounts = new Map<string, TokenAccountRecord>();
  private usageRecords: UsageRecord[] = [];
  private idCounter = 0;

  /**
   * Get or create a token account for a user.
   */
  getOrCreateAccount(userId: string): TokenAccountRecord {
    let account = this.findAccountByUserId(userId);
    if (!account) {
      account = {
        id: `acc-${++this.idCounter}`,
        userId,
        balanceUsd: 0,
        billingMode: 'pay_as_you_go',
        monthlyQuotaUsd: null,
        budgetAlertThreshold: null,
      };
      this.accounts.set(account.id, account);
    }
    return account;
  }

  /**
   * Record token usage for a user's API call.
   * Deducts from balance for pay_as_you_go mode.
   */
  meterUsage(userId: string, dto: MeterUsageDto): UsageRecord {
    const account = this.getOrCreateAccount(userId);

    // Check enterprise quota
    if (account.monthlyQuotaUsd !== null) {
      const monthlySpend = this.getMonthlySpend(account.id);
      if (monthlySpend + dto.priceUsd > account.monthlyQuotaUsd) {
        throw new BadRequestException('Monthly quota exceeded');
      }

      // Budget alert check
      if (
        account.budgetAlertThreshold !== null &&
        monthlySpend + dto.priceUsd > account.budgetAlertThreshold
      ) {
        this.logger.warn(
          `Budget alert: user ${userId} approaching quota (${monthlySpend + dto.priceUsd}/${account.monthlyQuotaUsd})`,
        );
      }
    }

    // Deduct from balance for pay_as_you_go
    if (account.billingMode === 'pay_as_you_go') {
      if (account.balanceUsd < dto.priceUsd) {
        throw new BadRequestException('Insufficient balance');
      }
      account.balanceUsd -= dto.priceUsd;
    }

    const record: UsageRecord = {
      id: `usage-${++this.idCounter}`,
      accountId: account.id,
      provider: dto.provider,
      model: dto.model,
      promptTokens: dto.promptTokens,
      completionTokens: dto.completionTokens,
      totalTokens: dto.totalTokens,
      costUsd: dto.costUsd,
      priceUsd: dto.priceUsd,
      createdAt: new Date(),
    };

    this.usageRecords.push(record);
    return record;
  }

  /**
   * Purchase quota: top-up balance or switch billing mode.
   */
  purchaseQuota(userId: string, dto: PurchaseQuotaDto): TokenAccountRecord {
    const account = this.getOrCreateAccount(userId);
    account.billingMode = dto.billingMode;

    if (dto.amountUsd && dto.amountUsd > 0) {
      account.balanceUsd += dto.amountUsd;
    }

    return account;
  }

  /**
   * Set enterprise quota: monthly usage cap and budget alert threshold.
   */
  setEnterpriseQuota(userId: string, dto: SetEnterpriseQuotaDto): TokenAccountRecord {
    const account = this.getOrCreateAccount(userId);

    if (dto.budgetAlertThreshold > dto.monthlyQuotaUsd) {
      throw new BadRequestException('Budget alert threshold cannot exceed monthly quota');
    }

    account.monthlyQuotaUsd = dto.monthlyQuotaUsd;
    account.budgetAlertThreshold = dto.budgetAlertThreshold;
    return account;
  }

  /**
   * Get usage dashboard: token consumption, cost breakdown, model distribution, daily trend.
   */
  getUsageDashboard(userId: string, startDate: string, endDate: string): UsageDashboardResponse {
    const account = this.findAccountByUserId(userId);
    if (!account) {
      throw new NotFoundException('Token account not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const records = this.usageRecords.filter(
      (r) => r.accountId === account.id && r.createdAt >= start && r.createdAt <= end,
    );

    const modelDistribution = this.aggregateByModel(records);
    const dailyTrend = this.aggregateByDay(records);

    return {
      totalTokens: records.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCostUsd: records.reduce((sum, r) => sum + r.costUsd, 0),
      totalPriceUsd: records.reduce((sum, r) => sum + r.priceUsd, 0),
      balance: account.balanceUsd,
      billingMode: account.billingMode,
      modelDistribution,
      dailyTrend,
    };
  }

  /** Exposed for testing */
  findAccountByUserId(userId: string): TokenAccountRecord | undefined {
    for (const account of this.accounts.values()) {
      if (account.userId === userId) return account;
    }
    return undefined;
  }

  private getMonthlySpend(accountId: string): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.usageRecords
      .filter((r) => r.accountId === accountId && r.createdAt >= monthStart)
      .reduce((sum, r) => sum + r.priceUsd, 0);
  }

  private aggregateByModel(records: UsageRecord[]): ModelUsageSummary[] {
    const map = new Map<string, ModelUsageSummary>();
    for (const r of records) {
      const key = `${r.provider}:${r.model}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalTokens += r.totalTokens;
        existing.totalPriceUsd += r.priceUsd;
        existing.callCount += 1;
      } else {
        map.set(key, {
          provider: r.provider,
          model: r.model,
          totalTokens: r.totalTokens,
          totalPriceUsd: r.priceUsd,
          callCount: 1,
        });
      }
    }
    return Array.from(map.values());
  }

  private aggregateByDay(records: UsageRecord[]): DailyUsage[] {
    const map = new Map<string, DailyUsage>();
    for (const r of records) {
      const date = r.createdAt.toISOString().slice(0, 10);
      const existing = map.get(date);
      if (existing) {
        existing.totalTokens += r.totalTokens;
        existing.totalPriceUsd += r.priceUsd;
        existing.callCount += 1;
      } else {
        map.set(date, {
          date,
          totalTokens: r.totalTokens,
          totalPriceUsd: r.priceUsd,
          callCount: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}
