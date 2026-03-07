import { BillingService } from './billing.service';
import type { MeterUsageDto } from './dto/billing.dto';

function makeUsageDto(overrides: Partial<MeterUsageDto> = {}): MeterUsageDto {
  return {
    provider: 'openai',
    model: 'gpt-4o',
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
    costUsd: 0.001,
    priceUsd: 0.002,
    ...overrides,
  };
}

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    service = new BillingService();
  });

  describe('getOrCreateAccount', () => {
    it('should create a new account for a new user', () => {
      const account = service.getOrCreateAccount('user-1');
      expect(account.userId).toBe('user-1');
      expect(account.balanceUsd).toBe(0);
      expect(account.billingMode).toBe('pay_as_you_go');
    });

    it('should return existing account for same user', () => {
      const a1 = service.getOrCreateAccount('user-1');
      const a2 = service.getOrCreateAccount('user-1');
      expect(a1.id).toBe(a2.id);
    });
  });

  describe('meterUsage', () => {
    it('should record usage and deduct from balance', () => {
      service.purchaseQuota('user-1', { billingMode: 'pay_as_you_go', amountUsd: 10 });
      const record = service.meterUsage('user-1', makeUsageDto());
      expect(record.totalTokens).toBe(150);
      expect(record.priceUsd).toBe(0.002);

      const account = service.findAccountByUserId('user-1')!;
      expect(account.balanceUsd).toBeCloseTo(9.998);
    });

    it('should throw when balance is insufficient', () => {
      service.getOrCreateAccount('user-1'); // balance = 0
      expect(() => service.meterUsage('user-1', makeUsageDto())).toThrow('Insufficient balance');
    });

    it('should throw when monthly quota exceeded', () => {
      service.purchaseQuota('user-1', { billingMode: 'monthly', amountUsd: 100 });
      service.setEnterpriseQuota('user-1', {
        monthlyQuotaUsd: 0.001,
        budgetAlertThreshold: 0.0005,
      });
      expect(() => service.meterUsage('user-1', makeUsageDto())).toThrow('Monthly quota exceeded');
    });

    it('should not deduct balance for monthly billing mode', () => {
      service.purchaseQuota('user-1', { billingMode: 'monthly', amountUsd: 10 });
      service.meterUsage('user-1', makeUsageDto());
      const account = service.findAccountByUserId('user-1')!;
      expect(account.balanceUsd).toBe(10); // unchanged
    });
  });

  describe('purchaseQuota', () => {
    it('should add balance and set billing mode', () => {
      const account = service.purchaseQuota('user-1', {
        billingMode: 'monthly',
        amountUsd: 50,
      });
      expect(account.billingMode).toBe('monthly');
      expect(account.balanceUsd).toBe(50);
    });

    it('should accumulate balance on multiple purchases', () => {
      service.purchaseQuota('user-1', { billingMode: 'pay_as_you_go', amountUsd: 20 });
      const account = service.purchaseQuota('user-1', {
        billingMode: 'pay_as_you_go',
        amountUsd: 30,
      });
      expect(account.balanceUsd).toBe(50);
    });
  });

  describe('setEnterpriseQuota', () => {
    it('should set monthly quota and alert threshold', () => {
      const account = service.setEnterpriseQuota('user-1', {
        monthlyQuotaUsd: 1000,
        budgetAlertThreshold: 800,
      });
      expect(account.monthlyQuotaUsd).toBe(1000);
      expect(account.budgetAlertThreshold).toBe(800);
    });

    it('should reject threshold exceeding quota', () => {
      expect(() =>
        service.setEnterpriseQuota('user-1', {
          monthlyQuotaUsd: 100,
          budgetAlertThreshold: 200,
        }),
      ).toThrow('Budget alert threshold cannot exceed monthly quota');
    });
  });

  describe('getUsageDashboard', () => {
    it('should return aggregated usage data', () => {
      service.purchaseQuota('user-1', { billingMode: 'pay_as_you_go', amountUsd: 100 });

      service.meterUsage('user-1', makeUsageDto({ model: 'gpt-4o', totalTokens: 100, priceUsd: 0.01 }));
      service.meterUsage('user-1', makeUsageDto({ model: 'gpt-4o', totalTokens: 200, priceUsd: 0.02 }));
      service.meterUsage('user-1', makeUsageDto({
        provider: 'anthropic',
        model: 'claude-3.5-sonnet',
        totalTokens: 300,
        priceUsd: 0.03,
      }));

      const today = new Date().toISOString().slice(0, 10);
      const dashboard = service.getUsageDashboard('user-1', today, today);

      expect(dashboard.totalTokens).toBe(600);
      expect(dashboard.totalPriceUsd).toBeCloseTo(0.06);
      expect(dashboard.modelDistribution).toHaveLength(2);
      expect(dashboard.dailyTrend).toHaveLength(1);
      expect(dashboard.dailyTrend[0].callCount).toBe(3);
    });

    it('should throw for non-existent user', () => {
      expect(() =>
        service.getUsageDashboard('nonexistent', '2025-01-01', '2025-01-31'),
      ).toThrow('Token account not found');
    });
  });
});
