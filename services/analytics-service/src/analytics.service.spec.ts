import { AnalyticsService } from './analytics.service';
import {
  ANOMALY_DEVIATION_THRESHOLD,
  ANOMALY_ROLLING_WINDOW_DAYS,
} from '@openclaw-club/shared';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
  });

  // ─── Dashboard (Req 12.1) ───

  describe('getDashboard', () => {
    it('should return zero values when no metrics recorded', () => {
      const result = service.getDashboard({});
      expect(result.activeUsers).toBe(0);
      expect(result.orders).toBe(0);
      expect(result.revenue).toBe(0);
      expect(result.satisfaction).toBe(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should return latest metric values', () => {
      service.recordMetric({ metric: 'active_users', value: 100, date: '2026-01-01' });
      service.recordMetric({ metric: 'active_users', value: 150, date: '2026-01-02' });
      service.recordMetric({ metric: 'orders', value: 50, date: '2026-01-01' });
      service.recordMetric({ metric: 'revenue', value: 9999.99, date: '2026-01-01' });
      service.recordMetric({ metric: 'satisfaction', value: 4.5, date: '2026-01-01' });

      const result = service.getDashboard({});
      expect(result.activeUsers).toBe(150);
      expect(result.orders).toBe(50);
      expect(result.revenue).toBe(9999.99);
      expect(result.satisfaction).toBe(4.5);
    });

    it('should filter by region', () => {
      service.recordMetric({ metric: 'orders', value: 30, region: 'apac', date: '2026-01-01' });
      service.recordMetric({ metric: 'orders', value: 20, region: 'na', date: '2026-01-01' });

      const apac = service.getDashboard({ region: 'apac' });
      expect(apac.orders).toBe(30);
      expect(apac.region).toBe('apac');

      const na = service.getDashboard({ region: 'na' });
      expect(na.orders).toBe(20);
    });
  });

  // ─── Reports (Req 12.2, 12.3) ───

  describe('generateReport', () => {
    it('should generate a daily report', () => {
      const result = service.generateReport({
        period: 'daily',
        startDate: '2026-01-01',
        endDate: '2026-01-01',
      });

      expect(result.id).toBeDefined();
      expect(result.period).toBe('daily');
      expect(result.startDate).toBe('2026-01-01');
      expect(result.endDate).toBe('2026-01-01');
      expect(result.data).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should generate reports for all periods', () => {
      const periods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const;
      for (const period of periods) {
        const result = service.generateReport({
          period,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        });
        expect(result.period).toBe(period);
      }
    });

    it('should generate a regional report', () => {
      const result = service.generateReport({
        period: 'monthly',
        region: 'eu',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
      expect(result.region).toBe('eu');
    });

    it('should throw for invalid period', () => {
      expect(() =>
        service.generateReport({
          period: 'biweekly' as any,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        }),
      ).toThrow(/Invalid period/);
    });

    it('should throw for missing startDate', () => {
      expect(() =>
        service.generateReport({ period: 'daily', startDate: '', endDate: '2026-01-01' }),
      ).toThrow(/startDate is required/);
    });

    it('should throw for missing endDate', () => {
      expect(() =>
        service.generateReport({ period: 'daily', startDate: '2026-01-01', endDate: '' }),
      ).toThrow(/endDate is required/);
    });

    it('should throw when startDate is after endDate', () => {
      expect(() =>
        service.generateReport({
          period: 'daily',
          startDate: '2026-02-01',
          endDate: '2026-01-01',
        }),
      ).toThrow(/startDate must be before endDate/);
    });
  });

  describe('exportReport', () => {
    let reportId: string;

    beforeEach(() => {
      service.recordMetric({ metric: 'active_users', value: 100, date: '2026-01-01' });
      service.recordMetric({ metric: 'orders', value: 50, date: '2026-01-01' });
      const report = service.generateReport({
        period: 'monthly',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
      reportId = report.id;
    });

    it('should export as CSV', () => {
      const result = service.exportReport({ reportId, format: 'csv' });
      expect(result.format).toBe('csv');
      expect(result.content).toContain('metric,value');
      expect(result.content).toContain('active_users,100');
      expect(result.content).toContain('orders,50');
      expect(result.exportedAt).toBeInstanceOf(Date);
    });

    it('should export as PDF', () => {
      const result = service.exportReport({ reportId, format: 'pdf' });
      expect(result.format).toBe('pdf');
      expect(result.content).toContain('[PDF]');
      expect(result.content).toContain(reportId);
    });

    it('should throw for invalid format', () => {
      expect(() =>
        service.exportReport({ reportId, format: 'xlsx' as any }),
      ).toThrow(/Invalid format/);
    });

    it('should throw for non-existent report', () => {
      expect(() =>
        service.exportReport({ reportId: 'non-existent', format: 'csv' }),
      ).toThrow(/not found/);
    });
  });

  // ─── Regional Stats (Req 12.4) ───

  describe('getRegionalStats', () => {
    it('should return stats for a specific region', () => {
      service.recordMetric({ metric: 'orders', value: 40, region: 'apac', date: '2026-01-01' });
      const result = service.getRegionalStats({ region: 'apac' });
      expect(result.region).toBe('apac');
      expect(result.orders).toBe(40);
    });

    it('should throw for invalid region', () => {
      expect(() =>
        service.getRegionalStats({ region: 'africa' as any }),
      ).toThrow(/Invalid region/);
    });
  });

  describe('getAllRegionalStats', () => {
    it('should return stats for all three regions', () => {
      const result = service.getAllRegionalStats();
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.region)).toEqual(['apac', 'na', 'eu']);
    });
  });

  // ─── Conversion Funnel (Req 12.5) ───

  describe('getConversionFunnel', () => {
    it('should return funnel with all stages', () => {
      service.setFunnelCount('registered', 1000);
      service.setFunnelCount('trial', 500);
      service.setFunnelCount('paid', 200);
      service.setFunnelCount('renewed', 150);

      const result = service.getConversionFunnel({});
      expect(result.stages).toHaveLength(4);
      expect(result.stages[0]).toEqual({ stage: 'registered', count: 1000, conversionRate: 100 });
      expect(result.stages[1]).toEqual({ stage: 'trial', count: 500, conversionRate: 50 });
      expect(result.stages[2]).toEqual({ stage: 'paid', count: 200, conversionRate: 40 });
      expect(result.stages[3]).toEqual({ stage: 'renewed', count: 150, conversionRate: 75 });
    });

    it('should return zero counts when no data', () => {
      const result = service.getConversionFunnel({});
      expect(result.stages.every((s) => s.count === 0)).toBe(true);
    });

    it('should support regional funnel', () => {
      service.setFunnelCount('registered', 300, 'eu');
      service.setFunnelCount('trial', 100, 'eu');

      const result = service.getConversionFunnel({ region: 'eu' });
      expect(result.region).toBe('eu');
      expect(result.stages[0].count).toBe(300);
      expect(result.stages[1].count).toBe(100);
      expect(result.stages[1].conversionRate).toBeCloseTo(33.33);
    });
  });

  describe('setFunnelCount', () => {
    it('should throw for invalid stage', () => {
      expect(() => service.setFunnelCount('unknown' as any, 100)).toThrow(/Invalid funnel stage/);
    });

    it('should throw for negative count', () => {
      expect(() => service.setFunnelCount('registered', -1)).toThrow(/non-negative/);
    });
  });

  // ─── Metric Recording & Anomaly Detection (Req 12.6) ───

  describe('recordMetric', () => {
    it('should record a metric', () => {
      const result = service.recordMetric({
        metric: 'active_users',
        value: 100,
        date: '2026-01-01',
      });
      expect(result.id).toBeDefined();
      expect(result.metric).toBe('active_users');
      expect(result.value).toBe(100);
      expect(result.date).toBe('2026-01-01');
    });

    it('should throw for invalid metric', () => {
      expect(() =>
        service.recordMetric({ metric: 'invalid' as any, value: 10, date: '2026-01-01' }),
      ).toThrow(/Invalid metric/);
    });

    it('should throw for negative value', () => {
      expect(() =>
        service.recordMetric({ metric: 'orders', value: -5, date: '2026-01-01' }),
      ).toThrow(/non-negative/);
    });

    it('should throw for missing date', () => {
      expect(() =>
        service.recordMetric({ metric: 'orders', value: 10, date: '' }),
      ).toThrow(/date is required/);
    });
  });

  describe('checkAnomalies', () => {
    it('should detect anomaly when value deviates >30% from 7-day average', () => {
      // Record 7 days of baseline data (100 orders/day)
      for (let i = 1; i <= 7; i++) {
        const day = String(i).padStart(2, '0');
        service.recordMetric({ metric: 'orders', value: 100, date: `2026-01-${day}` });
      }
      // Day 8: spike to 200 (100% deviation)
      service.recordMetric({ metric: 'orders', value: 200, date: '2026-01-08' });

      const alerts = service.checkAnomalies({ date: '2026-01-08' });
      expect(alerts.length).toBeGreaterThanOrEqual(1);

      const orderAlert = alerts.find((a) => a.metric === 'orders');
      expect(orderAlert).toBeDefined();
      expect(orderAlert!.currentValue).toBe(200);
      expect(orderAlert!.averageValue).toBe(100);
      expect(orderAlert!.deviationPercent).toBe(100);
    });

    it('should not alert when deviation is within threshold', () => {
      for (let i = 1; i <= 7; i++) {
        const day = String(i).padStart(2, '0');
        service.recordMetric({ metric: 'orders', value: 100, date: `2026-01-${day}` });
      }
      // Day 8: 120 (20% deviation, below 30% threshold)
      service.recordMetric({ metric: 'orders', value: 120, date: '2026-01-08' });

      const alerts = service.checkAnomalies({ date: '2026-01-08' });
      const orderAlert = alerts.find((a) => a.metric === 'orders');
      expect(orderAlert).toBeUndefined();
    });

    it('should return empty alerts when no baseline data', () => {
      service.recordMetric({ metric: 'orders', value: 200, date: '2026-01-01' });
      const alerts = service.checkAnomalies({ date: '2026-01-01' });
      expect(alerts).toHaveLength(0);
    });

    it('should throw for missing date', () => {
      expect(() => service.checkAnomalies({ date: '' })).toThrow(/date is required/);
    });

    it('should throw for invalid date', () => {
      expect(() => service.checkAnomalies({ date: 'not-a-date' })).toThrow(/Invalid date/);
    });
  });

  describe('getAnomalyAlerts', () => {
    it('should return all recorded alerts', () => {
      for (let i = 1; i <= 7; i++) {
        const day = String(i).padStart(2, '0');
        service.recordMetric({ metric: 'revenue', value: 1000, date: `2026-01-${day}` });
      }
      service.recordMetric({ metric: 'revenue', value: 2000, date: '2026-01-08' });
      service.checkAnomalies({ date: '2026-01-08' });

      const alerts = service.getAnomalyAlerts();
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
