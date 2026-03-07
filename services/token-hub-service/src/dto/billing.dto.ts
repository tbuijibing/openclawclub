import type { AIProvider, BillingMode } from '@openclaw-club/shared';

export class MeterUsageDto {
  provider!: AIProvider;
  model!: string;
  promptTokens!: number;
  completionTokens!: number;
  totalTokens!: number;
  costUsd!: number;
  priceUsd!: number;
}

export class PurchaseQuotaDto {
  billingMode!: BillingMode;
  /** Amount in USD to add (for pay_as_you_go top-up) */
  amountUsd?: number;
}

export class SetEnterpriseQuotaDto {
  monthlyQuotaUsd!: number;
  budgetAlertThreshold!: number;
}

export class UsageDashboardQueryDto {
  startDate!: string;
  endDate!: string;
}

/** Response types */
export interface UsageDashboardResponse {
  totalTokens: number;
  totalCostUsd: number;
  totalPriceUsd: number;
  balance: number;
  billingMode: string;
  modelDistribution: ModelUsageSummary[];
  dailyTrend: DailyUsage[];
}

export interface ModelUsageSummary {
  provider: string;
  model: string;
  totalTokens: number;
  totalPriceUsd: number;
  callCount: number;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalPriceUsd: number;
  callCount: number;
}
