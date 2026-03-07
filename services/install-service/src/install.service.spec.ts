import { InstallService, InstallOrderRecord, SettlementResult } from './install.service';
import { SERVICE_TIERS, MAX_WARRANTY_REPAIRS, ENGINEER_SHARE_PERCENT, PLATFORM_SHARE_PERCENT } from '@openclaw-club/shared';

describe('InstallService', () => {
  let service: InstallService;

  beforeEach(() => {
    service = new InstallService();
  });

  describe('getServiceTiers', () => {
    it('should return all three service tiers', () => {
      const tiers = service.getServiceTiers();
      expect(tiers).toHaveLength(3);
      expect(tiers.map((t) => t.tier)).toEqual(['standard', 'professional', 'enterprise']);
    });

    it('should have correct pricing', () => {
      const tiers = service.getServiceTiers();
      const prices = Object.fromEntries(tiers.map((t) => [t.tier, t.price]));
      expect(prices).toEqual({ standard: 99, professional: 299, enterprise: 999 });
    });

    it('should have correct OCSAS levels', () => {
      expect(SERVICE_TIERS.standard.ocsasLevel).toBe(1);
      expect(SERVICE_TIERS.professional.ocsasLevel).toBe(2);
      expect(SERVICE_TIERS.enterprise.ocsasLevel).toBe(3);
    });

    it('should have correct warranty days', () => {
      expect(SERVICE_TIERS.standard.warrantyDays).toBe(30);
      expect(SERVICE_TIERS.professional.warrantyDays).toBe(90);
      expect(SERVICE_TIERS.enterprise.warrantyDays).toBe(180);
    });
  });

  describe('createInstallOrder', () => {
    it('should create an install order with correct defaults', () => {
      const order = service.createInstallOrder({
        userId: 'user-1',
        tier: 'standard',
      });

      expect(order.userId).toBe('user-1');
      expect(order.serviceTier).toBe('standard');
      expect(order.ocsasLevel).toBe(1);
      expect(order.installStatus).toBe('pending_dispatch');
      expect(order.tokenHubConnected).toBe(true);
      expect(order.warrantyRepairCount).toBe(0);
    });

    it('should set ocsasLevel based on tier', () => {
      const pro = service.createInstallOrder({ userId: 'u1', tier: 'professional' });
      expect(pro.ocsasLevel).toBe(2);

      const ent = service.createInstallOrder({ userId: 'u1', tier: 'enterprise' });
      expect(ent.ocsasLevel).toBe(3);
    });

    it('should reject invalid tier', () => {
      expect(() =>
        service.createInstallOrder({ userId: 'u1', tier: 'invalid' as any }),
      ).toThrow();
    });
  });

  describe('updateProgress', () => {
    let order: InstallOrderRecord;

    beforeEach(() => {
      order = service.createInstallOrder({ userId: 'u1', tier: 'standard' });
      order.engineerId = 'eng-1';
    });

    it('should follow valid status transitions', () => {
      service.acceptOrder(order.id, 'eng-1');
      const updated = service.updateProgress(order.id, 'assessing');
      expect(updated.installStatus).toBe('assessing');
    });

    it('should reject invalid transitions', () => {
      expect(() => service.updateProgress(order.id, 'installing')).toThrow(
        /Cannot transition/,
      );
    });

    it('should complete the full lifecycle', () => {
      service.acceptOrder(order.id, 'eng-1');
      service.updateProgress(order.id, 'assessing');
      service.updateProgress(order.id, 'installing');
      service.updateProgress(order.id, 'configuring');
      service.updateProgress(order.id, 'testing');
      service.updateProgress(order.id, 'pending_acceptance');
      const completed = service.updateProgress(order.id, 'completed');
      expect(completed.installStatus).toBe('completed');
      expect(completed.warrantyEndDate).toBeDefined();
    });
  });

  describe('submitDeliveryReport', () => {
    let order: InstallOrderRecord;

    beforeEach(() => {
      order = service.createInstallOrder({ userId: 'u1', tier: 'professional' });
      service.acceptOrder(order.id, 'eng-1');
      service.updateProgress(order.id, 'assessing');
      service.updateProgress(order.id, 'installing');
      service.updateProgress(order.id, 'configuring');
      service.updateProgress(order.id, 'testing');
    });

    it('should submit a delivery report and transition to pending_acceptance', () => {
      const report = service.submitDeliveryReport(order.id, 'eng-1', {
        checklist: { os: 'installed' },
        configItems: { firewall: 'enabled' },
        testResults: { ping: 'ok' },
      });

      expect(report.installOrderId).toBe(order.id);
      const updated = service.getInstallOrder(order.id);
      expect(updated.installStatus).toBe('pending_acceptance');
    });

    it('should reject report from non-assigned engineer', () => {
      expect(() =>
        service.submitDeliveryReport(order.id, 'other-eng', {
          checklist: {},
          configItems: {},
          testResults: {},
        }),
      ).toThrow(/Only the assigned engineer/);
    });
  });

  describe('confirmAcceptance', () => {
    let order: InstallOrderRecord;

    beforeEach(() => {
      order = service.createInstallOrder({ userId: 'u1', tier: 'standard' });
      service.acceptOrder(order.id, 'eng-1');
      service.updateProgress(order.id, 'assessing');
      service.updateProgress(order.id, 'installing');
      service.updateProgress(order.id, 'configuring');
      service.updateProgress(order.id, 'testing');
      service.updateProgress(order.id, 'pending_acceptance');
    });

    it('should confirm acceptance and complete the order with settlement', () => {
      const result = service.confirmAcceptance(order.id, 'u1');
      expect(result.order.installStatus).toBe('completed');
      expect(result.order.acceptedByUserAt).toBeDefined();
      expect(result.settlement).toBeDefined();
      expect(result.settlement.engineerShare + result.settlement.platformShare).toBe(result.settlement.totalAmount);
    });

    it('should settle with correct share percentages', () => {
      const result = service.confirmAcceptance(order.id, 'u1');
      const tierDef = SERVICE_TIERS['standard'];
      expect(result.settlement.totalAmount).toBe(tierDef.price);
      expect(result.settlement.engineerShare).toBe(Math.round(tierDef.price * ENGINEER_SHARE_PERCENT) / 100);
      expect(result.settlement.platformShare).toBe(Math.round(tierDef.price * PLATFORM_SHARE_PERCENT) / 100);
      expect(result.settlement.currency).toBe('USD');
    });

    it('should reject acceptance from non-owner', () => {
      expect(() => service.confirmAcceptance(order.id, 'other-user')).toThrow(
        /Only the order owner/,
      );
    });
  });

  describe('submitReview', () => {
    let order: InstallOrderRecord;

    beforeEach(() => {
      order = service.createInstallOrder({ userId: 'u1', tier: 'standard' });
      service.acceptOrder(order.id, 'eng-1');
      service.updateProgress(order.id, 'assessing');
      service.updateProgress(order.id, 'installing');
      service.updateProgress(order.id, 'configuring');
      service.updateProgress(order.id, 'testing');
      service.updateProgress(order.id, 'pending_acceptance');
      service.confirmAcceptance(order.id, 'u1');
    });

    it('should submit a review with ratings', () => {
      const review = service.submitReview(order.id, 'u1', {
        overallRating: 5,
        attitudeRating: 5,
        skillRating: 4,
        responseRating: 5,
        comment: 'Great service!',
      });

      expect(review.overallRating).toBe(5);
      expect(review.comment).toBe('Great service!');
    });

    it('should reject invalid rating', () => {
      expect(() =>
        service.submitReview(order.id, 'u1', { overallRating: 6 }),
      ).toThrow(/Rating must be between 1 and 5/);
    });

    it('should reject invalid sub-rating', () => {
      expect(() =>
        service.submitReview(order.id, 'u1', { overallRating: 4, attitudeRating: 0 }),
      ).toThrow(/Rating must be between 1 and 5/);

      expect(() =>
        service.submitReview(order.id, 'u1', { overallRating: 4, skillRating: 6 }),
      ).toThrow(/Rating must be between 1 and 5/);
    });

    it('should reject duplicate review', () => {
      service.submitReview(order.id, 'u1', { overallRating: 4 });
      expect(() =>
        service.submitReview(order.id, 'u1', { overallRating: 3 }),
      ).toThrow(/Review already submitted/);
    });
  });

  describe('requestWarrantyRepair', () => {
    let order: InstallOrderRecord;

    beforeEach(() => {
      order = service.createInstallOrder({ userId: 'u1', tier: 'standard' });
      service.acceptOrder(order.id, 'eng-1');
      service.updateProgress(order.id, 'assessing');
      service.updateProgress(order.id, 'installing');
      service.updateProgress(order.id, 'configuring');
      service.updateProgress(order.id, 'testing');
      service.updateProgress(order.id, 'pending_acceptance');
      service.confirmAcceptance(order.id, 'u1');
    });

    it('should create a warranty ticket within warranty period with zero cost', () => {
      const ticket = service.requestWarrantyRepair(order.id, 'u1', 'System crash');
      expect(ticket.issue).toBe('System crash');
      expect(ticket.cost).toBe(0);
      expect(ticket.qualityInvestigation).toBe(false);
    });

    it('should trigger quality investigation after MAX_WARRANTY_REPAIRS', () => {
      service.requestWarrantyRepair(order.id, 'u1', 'Issue 1');
      service.requestWarrantyRepair(order.id, 'u1', 'Issue 2');
      const third = service.requestWarrantyRepair(order.id, 'u1', 'Issue 3');
      expect(third.qualityInvestigation).toBe(true);
    });

    it('should reject repair request after warranty expires', () => {
      // Manually expire warranty
      const o = service.getInstallOrder(order.id);
      o.warrantyEndDate = new Date(Date.now() - 1000);

      expect(() =>
        service.requestWarrantyRepair(order.id, 'u1', 'Late issue'),
      ).toThrow(/Warranty period has expired/);
    });
  });

  describe('processAutoAcceptance', () => {
    it('should auto-accept orders pending for more than 7 days with settlement', () => {
      const order = service.createInstallOrder({ userId: 'u1', tier: 'standard' });
      service.acceptOrder(order.id, 'eng-1');
      service.updateProgress(order.id, 'assessing');
      service.updateProgress(order.id, 'installing');
      service.updateProgress(order.id, 'configuring');
      service.updateProgress(order.id, 'testing');
      service.updateProgress(order.id, 'pending_acceptance');

      // Backdate updatedAt to 8 days ago
      const o = service.getInstallOrder(order.id);
      o.updatedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      const results = service.processAutoAcceptance();
      expect(results).toHaveLength(1);
      expect(results[0].order.installStatus).toBe('completed');
      expect(results[0].settlement).toBeDefined();
      expect(results[0].settlement.engineerShare + results[0].settlement.platformShare).toBe(results[0].settlement.totalAmount);
    });
  });
});
