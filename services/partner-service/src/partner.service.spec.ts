import { PartnerService } from './partner.service';
import {
  REVENUE_SHARE_PERCENTAGES,
  APPLICATION_REVIEW_BUSINESS_DAYS,
} from '@openclaw-club/shared';

describe('PartnerService', () => {
  let service: PartnerService;

  beforeEach(() => {
    service = new PartnerService();
  });

  // ─── Partner Application (Req 10.1, 10.2) ───

  describe('applyPartner', () => {
    it('should create a community contributor application', () => {
      const result = service.applyPartner({
        userId: 'user-1',
        type: 'community',
        name: 'Alice',
        qualifications: ['Open source contributor', '5 years experience'],
      });

      expect(result.id).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.type).toBe('community');
      expect(result.name).toBe('Alice');
      expect(result.status).toBe('pending');
      expect(result.qualifications).toHaveLength(2);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create a regional partner application', () => {
      const result = service.applyPartner({
        userId: 'user-2',
        type: 'regional',
        name: 'Bob Corp',
        qualifications: ['Regional IT distributor'],
        region: 'apac',
      });

      expect(result.type).toBe('regional');
      expect(result.region).toBe('apac');
    });

    it('should create a certified engineer application', () => {
      const result = service.applyPartner({
        userId: 'user-3',
        type: 'engineer',
        name: 'Charlie',
        qualifications: ['OCP certified', '3 years DevOps'],
      });

      expect(result.type).toBe('engineer');
    });

    it('should set review deadline to 5 business days', () => {
      const result = service.applyPartner({
        userId: 'user-1',
        type: 'community',
        name: 'Alice',
        qualifications: ['Contributor'],
      });

      expect(result.reviewDeadline).toBeInstanceOf(Date);
      expect(result.reviewDeadline.getTime()).toBeGreaterThan(result.createdAt.getTime());
    });

    it('should throw for empty userId', () => {
      expect(() =>
        service.applyPartner({
          userId: '',
          type: 'community',
          name: 'Alice',
          qualifications: ['Contributor'],
        }),
      ).toThrow(/userId is required/);
    });

    it('should throw for empty name', () => {
      expect(() =>
        service.applyPartner({
          userId: 'user-1',
          type: 'community',
          name: '',
          qualifications: ['Contributor'],
        }),
      ).toThrow(/name is required/);
    });

    it('should throw for invalid partner type', () => {
      expect(() =>
        service.applyPartner({
          userId: 'user-1',
          type: 'invalid' as any,
          name: 'Alice',
          qualifications: ['Contributor'],
        }),
      ).toThrow(/Invalid partner type/);
    });

    it('should throw for empty qualifications', () => {
      expect(() =>
        service.applyPartner({
          userId: 'user-1',
          type: 'community',
          name: 'Alice',
          qualifications: [],
        }),
      ).toThrow(/At least one qualification/);
    });
  });

  // ─── Application Review (Req 10.2) ───

  describe('reviewApplication', () => {
    let applicationId: string;

    beforeEach(() => {
      const app = service.applyPartner({
        userId: 'user-1',
        type: 'community',
        name: 'Alice',
        qualifications: ['Contributor'],
      });
      applicationId = app.id;
    });

    it('should approve an application', () => {
      const result = service.reviewApplication({
        applicationId,
        decision: 'approved',
        reviewerId: 'admin-1',
        reason: 'Meets all criteria',
      });

      expect(result.status).toBe('approved');
      expect(result.reviewerId).toBe('admin-1');
      expect(result.reviewReason).toBe('Meets all criteria');
      expect(result.reviewedAt).toBeInstanceOf(Date);
    });

    it('should reject an application', () => {
      const result = service.reviewApplication({
        applicationId,
        decision: 'rejected',
        reviewerId: 'admin-1',
        reason: 'Insufficient qualifications',
      });

      expect(result.status).toBe('rejected');
    });

    it('should throw for already reviewed application', () => {
      service.reviewApplication({
        applicationId,
        decision: 'approved',
        reviewerId: 'admin-1',
      });

      expect(() =>
        service.reviewApplication({
          applicationId,
          decision: 'rejected',
          reviewerId: 'admin-2',
        }),
      ).toThrow(/Cannot review application/);
    });

    it('should throw for non-existent application', () => {
      expect(() =>
        service.reviewApplication({
          applicationId: 'non-existent',
          decision: 'approved',
          reviewerId: 'admin-1',
        }),
      ).toThrow(/not found/);
    });

    it('should throw for empty reviewerId', () => {
      expect(() =>
        service.reviewApplication({
          applicationId,
          decision: 'approved',
          reviewerId: '',
        }),
      ).toThrow(/reviewerId is required/);
    });
  });

  describe('listApplicationsByUser', () => {
    it('should list applications for a specific user', () => {
      service.applyPartner({ userId: 'user-1', type: 'community', name: 'A', qualifications: ['q'] });
      service.applyPartner({ userId: 'user-1', type: 'engineer', name: 'A', qualifications: ['q'] });
      service.applyPartner({ userId: 'user-2', type: 'regional', name: 'B', qualifications: ['q'] });

      expect(service.listApplicationsByUser('user-1')).toHaveLength(2);
      expect(service.listApplicationsByUser('user-2')).toHaveLength(1);
      expect(service.listApplicationsByUser('user-3')).toHaveLength(0);
    });
  });


  // ─── Revenue Sharing (Req 10.3, 10.4, 10.5) ───

  describe('calculateAndRecordEarning', () => {
    it('should calculate 70% share for community contributor', () => {
      const result = service.calculateAndRecordEarning({
        partnerId: 'partner-1',
        partnerType: 'community',
        orderId: 'order-1',
        grossAmount: 100,
      });

      expect(result.sharePercentage).toBe(70);
      expect(result.netAmount).toBe(70);
      expect(result.status).toBe('pending');
    });

    it('should calculate 60% share for regional partner', () => {
      const result = service.calculateAndRecordEarning({
        partnerId: 'partner-2',
        partnerType: 'regional',
        orderId: 'order-2',
        grossAmount: 200,
      });

      expect(result.sharePercentage).toBe(60);
      expect(result.netAmount).toBe(120);
    });

    it('should calculate 80% share for certified engineer', () => {
      const result = service.calculateAndRecordEarning({
        partnerId: 'partner-3',
        partnerType: 'engineer',
        orderId: 'order-3',
        grossAmount: 299,
      });

      expect(result.sharePercentage).toBe(80);
      expect(result.netAmount).toBe(239.2);
    });

    it('should handle decimal amounts correctly', () => {
      const result = service.calculateAndRecordEarning({
        partnerId: 'partner-1',
        partnerType: 'community',
        orderId: 'order-4',
        grossAmount: 33.33,
      });

      expect(result.netAmount).toBe(23.33);
    });

    it('should set settlement month to current month', () => {
      const result = service.calculateAndRecordEarning({
        partnerId: 'partner-1',
        partnerType: 'community',
        orderId: 'order-5',
        grossAmount: 100,
      });

      expect(result.settlementMonth).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should throw for empty partnerId', () => {
      expect(() =>
        service.calculateAndRecordEarning({
          partnerId: '',
          partnerType: 'community',
          orderId: 'order-1',
          grossAmount: 100,
        }),
      ).toThrow(/partnerId is required/);
    });

    it('should throw for empty orderId', () => {
      expect(() =>
        service.calculateAndRecordEarning({
          partnerId: 'partner-1',
          partnerType: 'community',
          orderId: '',
          grossAmount: 100,
        }),
      ).toThrow(/orderId is required/);
    });

    it('should throw for zero or negative grossAmount', () => {
      expect(() =>
        service.calculateAndRecordEarning({
          partnerId: 'partner-1',
          partnerType: 'community',
          orderId: 'order-1',
          grossAmount: 0,
        }),
      ).toThrow(/grossAmount must be positive/);

      expect(() =>
        service.calculateAndRecordEarning({
          partnerId: 'partner-1',
          partnerType: 'community',
          orderId: 'order-1',
          grossAmount: -50,
        }),
      ).toThrow(/grossAmount must be positive/);
    });
  });

  // ─── Monthly Settlement (Req 10.6) ───

  describe('settleMonthlyEarnings', () => {
    it('should settle all pending earnings for a given month', () => {
      service.calculateAndRecordEarning({
        partnerId: 'p1',
        partnerType: 'engineer',
        orderId: 'o1',
        grossAmount: 100,
      });
      service.calculateAndRecordEarning({
        partnerId: 'p2',
        partnerType: 'community',
        orderId: 'o2',
        grossAmount: 200,
      });

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const result = service.settleMonthlyEarnings({ month });

      expect(result.month).toBe(month);
      expect(result.earningsCount).toBe(2);
      expect(result.totalSettled).toBe(80 + 140); // 80% of 100 + 70% of 200
      expect(result.settledAt).toBeInstanceOf(Date);
    });

    it('should only settle pending earnings, not already settled ones', () => {
      service.calculateAndRecordEarning({
        partnerId: 'p1',
        partnerType: 'engineer',
        orderId: 'o1',
        grossAmount: 100,
      });

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      service.settleMonthlyEarnings({ month });

      // Add another earning
      service.calculateAndRecordEarning({
        partnerId: 'p1',
        partnerType: 'engineer',
        orderId: 'o2',
        grossAmount: 200,
      });

      const result = service.settleMonthlyEarnings({ month });
      expect(result.earningsCount).toBe(1);
      expect(result.totalSettled).toBe(160); // 80% of 200
    });

    it('should throw for invalid month format', () => {
      expect(() => service.settleMonthlyEarnings({ month: '2026/03' })).toThrow(/YYYY-MM format/);
      expect(() => service.settleMonthlyEarnings({ month: 'March' })).toThrow(/YYYY-MM format/);
    });

    it('should throw when no pending earnings exist', () => {
      expect(() => service.settleMonthlyEarnings({ month: '2026-03' })).toThrow(
        /No pending earnings/,
      );
    });
  });

  // ─── Dashboard (Req 10.7) ───

  describe('getEarningsDashboard', () => {
    it('should return dashboard with correct totals', () => {
      service.calculateAndRecordEarning({
        partnerId: 'p1',
        partnerType: 'engineer',
        orderId: 'o1',
        grossAmount: 100,
      });
      service.calculateAndRecordEarning({
        partnerId: 'p1',
        partnerType: 'engineer',
        orderId: 'o2',
        grossAmount: 200,
      });

      const dashboard = service.getEarningsDashboard({ partnerId: 'p1' });

      expect(dashboard.partnerId).toBe('p1');
      expect(dashboard.totalOrders).toBe(2);
      expect(dashboard.totalRevenue).toBe(80 + 160); // 80% of 100 + 80% of 200
      expect(dashboard.pendingSettlement).toBe(240);
      expect(dashboard.settledAmount).toBe(0);
      expect(dashboard.paidAmount).toBe(0);
      expect(dashboard.earnings).toHaveLength(2);
    });

    it('should reflect settled amounts after settlement', () => {
      service.calculateAndRecordEarning({
        partnerId: 'p1',
        partnerType: 'engineer',
        orderId: 'o1',
        grossAmount: 100,
      });

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      service.settleMonthlyEarnings({ month });

      const dashboard = service.getEarningsDashboard({ partnerId: 'p1' });
      expect(dashboard.pendingSettlement).toBe(0);
      expect(dashboard.settledAmount).toBe(80);
    });

    it('should return empty dashboard for partner with no earnings', () => {
      const dashboard = service.getEarningsDashboard({ partnerId: 'no-partner' });

      expect(dashboard.totalOrders).toBe(0);
      expect(dashboard.totalRevenue).toBe(0);
      expect(dashboard.earnings).toHaveLength(0);
    });

    it('should throw for empty partnerId', () => {
      expect(() => service.getEarningsDashboard({ partnerId: '' })).toThrow(
        /partnerId is required/,
      );
    });
  });

  // ─── External Vendor Management (Req 10.8, 10.10) ───

  describe('registerExternalVendor', () => {
    it('should register a vendor from Fiverr', () => {
      const result = service.registerExternalVendor({
        name: 'Vendor A',
        platform: 'fiverr',
        platformProfileUrl: 'https://fiverr.com/vendora',
        skills: ['OpenClaw installation', 'Linux admin'],
        region: 'na',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Vendor A');
      expect(result.platform).toBe('fiverr');
      expect(result.status).toBe('active');
      expect(result.serviceRating).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.totalOrders).toBe(0);
    });

    it('should register a vendor from 猪八戒', () => {
      const result = service.registerExternalVendor({
        name: '服务商B',
        platform: 'zbj',
        skills: ['系统安装'],
      });

      expect(result.platform).toBe('zbj');
    });

    it('should throw for empty name', () => {
      expect(() =>
        service.registerExternalVendor({ name: '', platform: 'fiverr', skills: ['skill'] }),
      ).toThrow(/name is required/);
    });

    it('should throw for invalid platform', () => {
      expect(() =>
        service.registerExternalVendor({
          name: 'V',
          platform: 'invalid' as any,
          skills: ['skill'],
        }),
      ).toThrow(/Invalid platform/);
    });

    it('should throw for empty skills', () => {
      expect(() =>
        service.registerExternalVendor({ name: 'V', platform: 'fiverr', skills: [] }),
      ).toThrow(/At least one skill/);
    });
  });

  describe('updateVendorProfile', () => {
    let vendorId: string;

    beforeEach(() => {
      const vendor = service.registerExternalVendor({
        name: 'Vendor A',
        platform: 'upwork',
        skills: ['OpenClaw'],
      });
      vendorId = vendor.id;
    });

    it('should update service rating', () => {
      const result = service.updateVendorProfile({ vendorId, serviceRating: 4.5 });
      expect(result.serviceRating).toBe(4.5);
    });

    it('should update completion rate', () => {
      const result = service.updateVendorProfile({ vendorId, completionRate: 95 });
      expect(result.completionRate).toBe(95);
    });

    it('should add feedback', () => {
      service.updateVendorProfile({ vendorId, feedback: 'Great work!' });
      const result = service.updateVendorProfile({ vendorId, feedback: 'Fast delivery' });
      expect(result.feedbacks).toEqual(['Great work!', 'Fast delivery']);
    });

    it('should throw for rating out of range', () => {
      expect(() => service.updateVendorProfile({ vendorId, serviceRating: 6 })).toThrow(
        /between 0 and 5/,
      );
      expect(() => service.updateVendorProfile({ vendorId, serviceRating: -1 })).toThrow(
        /between 0 and 5/,
      );
    });

    it('should throw for completion rate out of range', () => {
      expect(() => service.updateVendorProfile({ vendorId, completionRate: 101 })).toThrow(
        /between 0 and 100/,
      );
    });

    it('should throw for non-existent vendor', () => {
      expect(() =>
        service.updateVendorProfile({ vendorId: 'non-existent', serviceRating: 4 }),
      ).toThrow(/not found/);
    });
  });

  // ─── Order Distribution (Req 10.8, 10.9) ───

  describe('distributeOrder', () => {
    let vendorId: string;

    beforeEach(() => {
      const vendor = service.registerExternalVendor({
        name: 'Vendor A',
        platform: 'fiverr',
        skills: ['OpenClaw'],
      });
      vendorId = vendor.id;
    });

    it('should distribute an order to a vendor', () => {
      const result = service.distributeOrder({
        orderId: 'order-1',
        vendorId,
        platform: 'fiverr',
      });

      expect(result.id).toBeDefined();
      expect(result.orderId).toBe('order-1');
      expect(result.vendorId).toBe(vendorId);
      expect(result.platform).toBe('fiverr');
      expect(result.distributedAt).toBeInstanceOf(Date);
    });

    it('should increment vendor totalOrders', () => {
      service.distributeOrder({ orderId: 'o1', vendorId, platform: 'fiverr' });
      service.distributeOrder({ orderId: 'o2', vendorId, platform: 'fiverr' });

      const vendor = service.getVendor(vendorId);
      expect(vendor.totalOrders).toBe(2);
    });

    it('should throw for empty orderId', () => {
      expect(() =>
        service.distributeOrder({ orderId: '', vendorId, platform: 'fiverr' }),
      ).toThrow(/orderId is required/);
    });

    it('should throw for empty vendorId', () => {
      expect(() =>
        service.distributeOrder({ orderId: 'o1', vendorId: '', platform: 'fiverr' }),
      ).toThrow(/vendorId is required/);
    });

    it('should throw for non-existent vendor', () => {
      expect(() =>
        service.distributeOrder({ orderId: 'o1', vendorId: 'non-existent', platform: 'fiverr' }),
      ).toThrow(/not found/);
    });
  });

  // ─── Vendor Conversion (Req 10.11) ───

  describe('convertToCertifiedEngineer', () => {
    let vendorId: string;

    beforeEach(() => {
      const vendor = service.registerExternalVendor({
        name: 'Vendor A',
        platform: 'fiverr',
        skills: ['OpenClaw'],
      });
      vendorId = vendor.id;
      // Give vendor an order and a good rating
      service.distributeOrder({ orderId: 'o1', vendorId, platform: 'fiverr' });
      service.updateVendorProfile({ vendorId, serviceRating: 4.0 });
    });

    it('should convert a qualified vendor to certified engineer', () => {
      const result = service.convertToCertifiedEngineer({ vendorId });
      expect(result.status).toBe('converted');
    });

    it('should throw if vendor has no completed orders', () => {
      const newVendor = service.registerExternalVendor({
        name: 'New Vendor',
        platform: 'upwork',
        skills: ['skill'],
      });
      service.updateVendorProfile({ vendorId: newVendor.id, serviceRating: 4.0 });

      expect(() => service.convertToCertifiedEngineer({ vendorId: newVendor.id })).toThrow(
        /at least 1 order/,
      );
    });

    it('should throw if vendor rating is below 3.0', () => {
      const lowRatedVendor = service.registerExternalVendor({
        name: 'Low Rated',
        platform: 'upwork',
        skills: ['skill'],
      });
      service.distributeOrder({ orderId: 'o2', vendorId: lowRatedVendor.id, platform: 'upwork' });
      service.updateVendorProfile({ vendorId: lowRatedVendor.id, serviceRating: 2.5 });

      expect(() =>
        service.convertToCertifiedEngineer({ vendorId: lowRatedVendor.id }),
      ).toThrow(/service rating of at least 3.0/);
    });

    it('should throw if vendor is already converted', () => {
      service.convertToCertifiedEngineer({ vendorId });

      expect(() => service.convertToCertifiedEngineer({ vendorId })).toThrow(
        /already been converted/,
      );
    });

    it('should throw for non-existent vendor', () => {
      expect(() =>
        service.convertToCertifiedEngineer({ vendorId: 'non-existent' }),
      ).toThrow(/not found/);
    });
  });

  // ─── Business Days Helper ───

  describe('addBusinessDays', () => {
    it('should skip weekends', () => {
      // Friday 2026-01-02
      const friday = new Date('2026-01-02T10:00:00Z');
      const result = service.addBusinessDays(friday, APPLICATION_REVIEW_BUSINESS_DAYS);

      expect(result.getDay()).not.toBe(0);
      expect(result.getDay()).not.toBe(6);
    });

    it('should return a date after the start date', () => {
      const start = new Date('2026-03-10T10:00:00Z');
      const result = service.addBusinessDays(start, APPLICATION_REVIEW_BUSINESS_DAYS);
      expect(result.getTime()).toBeGreaterThan(start.getTime());
    });

    it('should handle 0 business days', () => {
      const start = new Date('2026-03-10T10:00:00Z');
      const result = service.addBusinessDays(start, 0);
      expect(result.toDateString()).toBe(start.toDateString());
    });
  });
});
