import { SubscriptionService, SubscriptionRecord, ConfigPackRecord } from './subscription.service';
import {
  CONFIGURATION_PACKS,
  YEARLY_MONTHS_CHARGED,
  RENEWAL_REMINDER_DAYS,
  DATA_RETENTION_DAYS,
} from '@openclaw-club/shared';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
  });

  describe('getConfigurationPacks', () => {
    it('should return all three configuration packs', () => {
      const packs = service.getConfigurationPacks();
      expect(packs).toHaveLength(3);
      const categories = packs.map((p) => p.category).sort();
      expect(categories).toEqual(['developer', 'enterprise', 'productivity']);
    });

    it('should have correct pricing', () => {
      const packs = service.getConfigurationPacks();
      const prices = Object.fromEntries(packs.map((p) => [p.category, p.monthlyPrice]));
      expect(prices).toEqual({ productivity: 49, developer: 79, enterprise: 199 });
    });

    it('should have features for each pack', () => {
      const packs = service.getConfigurationPacks();
      for (const pack of packs) {
        expect(pack.features.length).toBeGreaterThan(0);
      }
    });
  });

  describe('calculatePrice', () => {
    it('should return monthly price for monthly cycle', () => {
      expect(service.calculatePrice(49, 'monthly')).toBe(49);
      expect(service.calculatePrice(79, 'monthly')).toBe(79);
      expect(service.calculatePrice(199, 'monthly')).toBe(199);
    });

    it('should return 10 months price for yearly cycle (2 months free)', () => {
      expect(service.calculatePrice(49, 'yearly')).toBe(49 * YEARLY_MONTHS_CHARGED);
      expect(service.calculatePrice(79, 'yearly')).toBe(79 * YEARLY_MONTHS_CHARGED);
      expect(service.calculatePrice(199, 'yearly')).toBe(199 * YEARLY_MONTHS_CHARGED);
    });
  });

  describe('calculatePeriodEnd', () => {
    it('should add 1 month for monthly cycle', () => {
      const start = new Date('2025-01-15T00:00:00Z');
      const end = service.calculatePeriodEnd(start, 'monthly');
      expect(end.getMonth()).toBe(1); // February
      expect(end.getFullYear()).toBe(2025);
    });

    it('should add 1 year for yearly cycle', () => {
      const start = new Date('2025-01-15T00:00:00Z');
      const end = service.calculatePeriodEnd(start, 'yearly');
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(0); // January
    });
  });

  describe('subscribe', () => {
    it('should create a monthly subscription', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;

      const sub = service.subscribe('user-1', pack.id, 'monthly');

      expect(sub.userId).toBe('user-1');
      expect(sub.packId).toBe(pack.id);
      expect(sub.cycle).toBe('monthly');
      expect(sub.status).toBe('active');
      expect(sub.autoRenew).toBe(true);
      expect(sub.currentPeriodStart).toBeDefined();
      expect(sub.currentPeriodEnd).toBeDefined();
    });

    it('should create a yearly subscription', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'developer')!;

      const sub = service.subscribe('user-1', pack.id, 'yearly');

      expect(sub.cycle).toBe('yearly');
      expect(sub.status).toBe('active');
      // Yearly period should be ~1 year from start
      const diffMs = sub.currentPeriodEnd.getTime() - sub.currentPeriodStart.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(364);
      expect(diffDays).toBeLessThanOrEqual(366);
    });

    it('should reject subscription to non-existent pack', () => {
      expect(() => service.subscribe('user-1', 'non-existent', 'monthly')).toThrow(
        /not found/,
      );
    });

    it('should reject duplicate active subscription to same pack', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;

      service.subscribe('user-1', pack.id, 'monthly');
      expect(() => service.subscribe('user-1', pack.id, 'monthly')).toThrow(
        /already has an active subscription/,
      );
    });

    it('should allow subscription to different packs', () => {
      const packs = service.getConfigurationPacks();
      const prod = packs.find((p) => p.category === 'productivity')!;
      const dev = packs.find((p) => p.category === 'developer')!;

      const sub1 = service.subscribe('user-1', prod.id, 'monthly');
      const sub2 = service.subscribe('user-1', dev.id, 'monthly');

      expect(sub1.id).not.toBe(sub2.id);
    });

    it('should allow re-subscription after cancellation', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;

      const sub1 = service.subscribe('user-1', pack.id, 'monthly');
      service.cancelSubscription(sub1.id);

      const sub2 = service.subscribe('user-1', pack.id, 'monthly');
      expect(sub2.status).toBe('active');
    });
  });

  describe('deployPack', () => {
    it('should deploy successfully for active subscription', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      const result = service.deployPack(sub.id);

      expect(result.status).toBe('success');
      expect(result.subscriptionId).toBe(sub.id);
      expect(result.packId).toBe(pack.id);
      expect(result.deployedAt).toBeDefined();
    });

    it('should reject deploy for non-active subscription', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');
      service.cancelSubscription(sub.id);

      expect(() => service.deployPack(sub.id)).toThrow(/not active/);
    });

    it('should handle deploy failure with error logging (Req 3.7)', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      service.setSimulateDeployFailure(true);
      const result = service.deployPack(sub.id);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();

      const errors = service.getDeployErrors(sub.id);
      expect(errors).toHaveLength(1);
      expect(errors[0].techSupportNotified).toBe(true);
      expect(errors[0].userNotified).toBe(true);
    });
  });

  describe('processAutoRenewal', () => {
    it('should renew an active subscription with auto-renew enabled', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'developer')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');
      const originalEnd = new Date(sub.currentPeriodEnd);

      const result = service.processAutoRenewal(sub.id);

      expect(result.renewed).toBe(true);
      expect(result.newPeriodStart!.getTime()).toBe(originalEnd.getTime());
      expect(result.amountCharged).toBe(pack.monthlyPrice);
    });

    it('should charge yearly price for yearly subscription renewal', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'yearly');

      const result = service.processAutoRenewal(sub.id);

      expect(result.renewed).toBe(true);
      expect(result.amountCharged).toBe(pack.monthlyPrice * YEARLY_MONTHS_CHARGED);
    });

    it('should expire subscription when auto-renew is disabled', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      // Disable auto-renew
      const record = service.getSubscription(sub.id);
      record.autoRenew = false;

      const result = service.processAutoRenewal(sub.id);

      expect(result.renewed).toBe(false);
      expect(result.error).toContain('disabled');
      expect(service.getSubscription(sub.id).status).toBe('expired');
    });

    it('should not renew a cancelled subscription', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');
      service.cancelSubscription(sub.id);

      const result = service.processAutoRenewal(sub.id);

      expect(result.renewed).toBe(false);
      expect(result.error).toContain('not active');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel an active subscription and set data retention', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      service.cancelSubscription(sub.id);

      const cancelled = service.getSubscription(sub.id);
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.autoRenew).toBe(false);
      expect(cancelled.cancelledAt).toBeDefined();
      expect(cancelled.dataRetentionUntil).toBeDefined();

      // Data retention should be ~30 days from cancellation
      const retentionMs = cancelled.dataRetentionUntil!.getTime() - cancelled.cancelledAt!.getTime();
      const retentionDays = retentionMs / (1000 * 60 * 60 * 24);
      expect(retentionDays).toBeCloseTo(DATA_RETENTION_DAYS, 0);
    });

    it('should reject cancelling an already cancelled subscription', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      service.cancelSubscription(sub.id);
      expect(() => service.cancelSubscription(sub.id)).toThrow(/already cancelled/);
    });

    it('should reject cancelling a non-existent subscription', () => {
      expect(() => service.cancelSubscription('non-existent')).toThrow(/not found/);
    });
  });

  describe('pushUpdate', () => {
    it('should push update to all active subscribers', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;

      service.subscribe('user-1', pack.id, 'monthly');
      service.subscribe('user-2', pack.id, 'yearly');

      const result = service.pushUpdate(pack.id, '2.0.0');

      expect(result.version).toBe('2.0.0');
      expect(result.subscribersNotified).toBe(2);
      expect(result.failures).toHaveLength(0);

      // Pack version should be updated
      const updatedPack = service.getConfigPack(pack.id);
      expect(updatedPack.version).toBe('2.0.0');
    });

    it('should not push to cancelled subscribers', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;

      const sub1 = service.subscribe('user-1', pack.id, 'monthly');
      service.subscribe('user-2', pack.id, 'monthly');
      service.cancelSubscription(sub1.id);

      const result = service.pushUpdate(pack.id, '2.0.0');

      expect(result.subscribersNotified).toBe(1);
    });

    it('should track failures during update push', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;

      service.subscribe('user-1', pack.id, 'monthly');
      service.setSimulateDeployFailure(true);

      const result = service.pushUpdate(pack.id, '2.0.0');

      expect(result.subscribersNotified).toBe(0);
      expect(result.failures).toHaveLength(1);
    });
  });

  describe('getSubscriptionsDueForReminder', () => {
    it('should return subscriptions expiring within reminder window (Req 3.4)', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      // Set period end to 5 days from now (within 7-day reminder window)
      const record = service.getSubscription(sub.id);
      record.currentPeriodEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      const due = service.getSubscriptionsDueForReminder();
      expect(due).toHaveLength(1);
      expect(due[0].id).toBe(sub.id);
    });

    it('should not return subscriptions expiring beyond reminder window', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      // Period end is ~30 days from now (default monthly), well beyond 7-day window
      const due = service.getSubscriptionsDueForReminder();
      expect(due).toHaveLength(0);
    });

    it('should not return cancelled subscriptions', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      const record = service.getSubscription(sub.id);
      record.currentPeriodEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      service.cancelSubscription(sub.id);

      const due = service.getSubscriptionsDueForReminder();
      expect(due).toHaveLength(0);
    });
  });

  describe('processExpiredSubscriptions', () => {
    it('should expire subscriptions past their period end', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      const sub = service.subscribe('user-1', pack.id, 'monthly');

      // Set period end to the past
      const record = service.getSubscription(sub.id);
      record.currentPeriodEnd = new Date(Date.now() - 1000);

      const expired = service.processExpiredSubscriptions();
      expect(expired).toHaveLength(1);
      expect(expired[0].status).toBe('expired');
    });

    it('should not expire active subscriptions with future period end', () => {
      const packs = service.getConfigurationPacks();
      const pack = packs.find((p) => p.category === 'productivity')!;
      service.subscribe('user-1', pack.id, 'monthly');

      const expired = service.processExpiredSubscriptions();
      expect(expired).toHaveLength(0);
    });
  });

  describe('listByUser', () => {
    it('should list all subscriptions for a user', () => {
      const packs = service.getConfigurationPacks();
      const prod = packs.find((p) => p.category === 'productivity')!;
      const dev = packs.find((p) => p.category === 'developer')!;

      service.subscribe('user-1', prod.id, 'monthly');
      service.subscribe('user-1', dev.id, 'yearly');
      service.subscribe('user-2', prod.id, 'monthly');

      const user1Subs = service.listByUser('user-1');
      expect(user1Subs).toHaveLength(2);

      const user2Subs = service.listByUser('user-2');
      expect(user2Subs).toHaveLength(1);
    });
  });
});
