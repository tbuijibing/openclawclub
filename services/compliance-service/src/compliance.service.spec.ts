import { ComplianceService } from './compliance.service';
import {
  DATA_DELETION_MAX_DAYS,
  CRITICAL_REMEDIATION_SLA_HOURS,
} from '@openclaw-club/shared';

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(() => {
    service = new ComplianceService();
  });

  // ─── Data Deletion (Req 13.4) ───

  describe('requestDataDeletion', () => {
    it('should create a deletion request with 30-day deadline', () => {
      const result = service.requestDataDeletion({ userId: 'user-1' });

      expect(result.id).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.status).toBe('pending');
      expect(result.requestedAt).toBeInstanceOf(Date);
      expect(result.deadline).toBeInstanceOf(Date);

      const daysDiff = Math.round(
        (result.deadline.getTime() - result.requestedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(DATA_DELETION_MAX_DAYS);
    });

    it('should store optional reason', () => {
      const result = service.requestDataDeletion({ userId: 'user-1', reason: 'Account closure' });
      expect(result.reason).toBe('Account closure');
    });

    it('should throw for missing userId', () => {
      expect(() => service.requestDataDeletion({ userId: '' })).toThrow('userId is required');
    });

    it('should throw if a pending request already exists', () => {
      service.requestDataDeletion({ userId: 'user-1' });
      expect(() => service.requestDataDeletion({ userId: 'user-1' })).toThrow(
        'already in progress',
      );
    });
  });

  describe('processDataDeletion', () => {
    it('should complete a deletion request and notify user', () => {
      const req = service.requestDataDeletion({ userId: 'user-1' });
      const result = service.processDataDeletion({ requestId: req.id });

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.notifiedAt).toBeInstanceOf(Date);
    });

    it('should clean up related cookie consent data', () => {
      service.recordCookieConsent({
        userId: 'user-1',
        countryCode: 'DE',
        categories: ['essential'],
      });
      const req = service.requestDataDeletion({ userId: 'user-1' });
      service.processDataDeletion({ requestId: req.id });

      expect(() => service.getCookieConsent({ userId: 'user-1' })).toThrow('not found');
    });

    it('should throw for non-existent request', () => {
      expect(() => service.processDataDeletion({ requestId: 'non-existent' })).toThrow(
        'not found',
      );
    });

    it('should throw if already completed', () => {
      const req = service.requestDataDeletion({ userId: 'user-1' });
      service.processDataDeletion({ requestId: req.id });
      expect(() => service.processDataDeletion({ requestId: req.id })).toThrow(
        'already completed',
      );
    });
  });

  describe('getDataDeletionStatus', () => {
    it('should return the deletion request status', () => {
      const req = service.requestDataDeletion({ userId: 'user-1' });
      const result = service.getDataDeletionStatus({ requestId: req.id });
      expect(result.id).toBe(req.id);
      expect(result.status).toBe('pending');
    });

    it('should throw for non-existent request', () => {
      expect(() => service.getDataDeletionStatus({ requestId: 'non-existent' })).toThrow(
        'not found',
      );
    });
  });

  // ─── Cookie Consent (Req 13.7) ───

  describe('recordCookieConsent', () => {
    it('should record consent for EU user', () => {
      const result = service.recordCookieConsent({
        userId: 'user-1',
        countryCode: 'DE',
        categories: ['essential', 'analytics'],
      });

      expect(result.userId).toBe('user-1');
      expect(result.isEU).toBe(true);
      expect(result.categories).toEqual(['essential', 'analytics']);
      expect(result.consentedAt).toBeInstanceOf(Date);
    });

    it('should record consent for non-EU user', () => {
      const result = service.recordCookieConsent({
        userId: 'user-2',
        countryCode: 'US',
        categories: ['essential', 'analytics', 'marketing'],
      });

      expect(result.isEU).toBe(false);
    });

    it('should throw if EU user does not include essential cookies', () => {
      expect(() =>
        service.recordCookieConsent({
          userId: 'user-1',
          countryCode: 'FR',
          categories: ['analytics'],
        }),
      ).toThrow('Essential cookies must be included');
    });

    it('should throw for missing userId', () => {
      expect(() =>
        service.recordCookieConsent({ userId: '', countryCode: 'US', categories: ['essential'] }),
      ).toThrow('userId is required');
    });

    it('should throw for missing countryCode', () => {
      expect(() =>
        service.recordCookieConsent({ userId: 'user-1', countryCode: '', categories: ['essential'] }),
      ).toThrow('countryCode is required');
    });

    it('should throw for empty categories', () => {
      expect(() =>
        service.recordCookieConsent({ userId: 'user-1', countryCode: 'US', categories: [] }),
      ).toThrow('At least one cookie category');
    });
  });

  describe('getCookieConsent', () => {
    it('should return existing consent', () => {
      service.recordCookieConsent({
        userId: 'user-1',
        countryCode: 'DE',
        categories: ['essential'],
      });
      const result = service.getCookieConsent({ userId: 'user-1' });
      expect(result.userId).toBe('user-1');
    });

    it('should throw for non-existent consent', () => {
      expect(() => service.getCookieConsent({ userId: 'non-existent' })).toThrow('not found');
    });
  });

  describe('updateCookieConsent', () => {
    it('should update cookie categories', () => {
      service.recordCookieConsent({
        userId: 'user-1',
        countryCode: 'DE',
        categories: ['essential'],
      });

      const result = service.updateCookieConsent({
        userId: 'user-1',
        categories: ['essential', 'analytics', 'preferences'],
      });

      expect(result.categories).toEqual(['essential', 'analytics', 'preferences']);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw if EU user removes essential cookies', () => {
      service.recordCookieConsent({
        userId: 'user-1',
        countryCode: 'FR',
        categories: ['essential', 'analytics'],
      });

      expect(() =>
        service.updateCookieConsent({ userId: 'user-1', categories: ['analytics'] }),
      ).toThrow('Essential cookies must be included');
    });

    it('should throw for non-existent user', () => {
      expect(() =>
        service.updateCookieConsent({ userId: 'non-existent', categories: ['essential'] }),
      ).toThrow('not found');
    });
  });

  // ─── Data Isolation (Req 8.5) ───

  describe('getDataRegion', () => {
    it('should return eu for EU countries', () => {
      expect(service.getDataRegion({ countryCode: 'DE' })).toBe('eu');
      expect(service.getDataRegion({ countryCode: 'FR' })).toBe('eu');
      expect(service.getDataRegion({ countryCode: 'IT' })).toBe('eu');
    });

    it('should return apac for Asia-Pacific countries', () => {
      expect(service.getDataRegion({ countryCode: 'CN' })).toBe('apac');
      expect(service.getDataRegion({ countryCode: 'JP' })).toBe('apac');
      expect(service.getDataRegion({ countryCode: 'KR' })).toBe('apac');
    });

    it('should return na for other countries', () => {
      expect(service.getDataRegion({ countryCode: 'US' })).toBe('na');
      expect(service.getDataRegion({ countryCode: 'CA' })).toBe('na');
      expect(service.getDataRegion({ countryCode: 'BR' })).toBe('na');
    });

    it('should be case-insensitive', () => {
      expect(service.getDataRegion({ countryCode: 'de' })).toBe('eu');
    });

    it('should throw for missing countryCode', () => {
      expect(() => service.getDataRegion({ countryCode: '' })).toThrow('countryCode is required');
    });
  });

  describe('validateDataResidency', () => {
    it('should reject EU data transfer outside EU', () => {
      service.assignDataResidency('user-1', 'DE');
      const result = service.validateDataResidency({ userId: 'user-1', targetRegion: 'na' });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('GDPR');
    });

    it('should allow EU data to stay in EU', () => {
      service.assignDataResidency('user-1', 'DE');
      const result = service.validateDataResidency({ userId: 'user-1', targetRegion: 'eu' });
      expect(result.valid).toBe(true);
    });

    it('should allow non-EU data transfer to any region', () => {
      service.assignDataResidency('user-2', 'US');
      const result = service.validateDataResidency({ userId: 'user-2', targetRegion: 'eu' });
      expect(result.valid).toBe(true);
    });

    it('should return invalid for unknown user', () => {
      const result = service.validateDataResidency({ userId: 'unknown', targetRegion: 'eu' });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('No data residency record');
    });
  });

  describe('assignDataResidency', () => {
    it('should assign correct region based on country', () => {
      const result = service.assignDataResidency('user-1', 'DE');
      expect(result.region).toBe('eu');
      expect(result.countryCode).toBe('DE');
      expect(result.assignedAt).toBeInstanceOf(Date);
    });

    it('should throw for missing userId', () => {
      expect(() => service.assignDataResidency('', 'DE')).toThrow('userId is required');
    });

    it('should throw for missing countryCode', () => {
      expect(() => service.assignDataResidency('user-1', '')).toThrow('countryCode is required');
    });
  });

  // ─── Vulnerability Scanning (Req 13.5) ───

  describe('scheduleQuarterlyScan', () => {
    it('should schedule a scan', () => {
      const result = service.scheduleQuarterlyScan({ scheduledDate: '2026-04-01' });
      expect(result.id).toBeDefined();
      expect(result.scheduledDate).toBe('2026-04-01');
      expect(result.status).toBe('scheduled');
      expect(result.vulnerabilityCount).toBe(0);
    });

    it('should throw for missing scheduledDate', () => {
      expect(() => service.scheduleQuarterlyScan({ scheduledDate: '' })).toThrow(
        'scheduledDate is required',
      );
    });

    it('should throw for invalid date', () => {
      expect(() => service.scheduleQuarterlyScan({ scheduledDate: 'not-a-date' })).toThrow(
        'Invalid scheduledDate',
      );
    });
  });

  describe('executeScan', () => {
    it('should start a scheduled scan', () => {
      const scan = service.scheduleQuarterlyScan({ scheduledDate: '2026-04-01' });
      const result = service.executeScan(scan.id);
      expect(result.status).toBe('running');
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('should throw for non-existent scan', () => {
      expect(() => service.executeScan('non-existent')).toThrow('not found');
    });

    it('should throw if scan is not in scheduled state', () => {
      const scan = service.scheduleQuarterlyScan({ scheduledDate: '2026-04-01' });
      service.executeScan(scan.id);
      expect(() => service.executeScan(scan.id)).toThrow('cannot execute');
    });
  });

  describe('completeScan', () => {
    it('should complete a running scan', () => {
      const scan = service.scheduleQuarterlyScan({ scheduledDate: '2026-04-01' });
      service.executeScan(scan.id);
      const result = service.completeScan(scan.id);
      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should throw if scan is not running', () => {
      const scan = service.scheduleQuarterlyScan({ scheduledDate: '2026-04-01' });
      expect(() => service.completeScan(scan.id)).toThrow('cannot complete');
    });
  });

  describe('reportVulnerability', () => {
    let scanId: string;

    beforeEach(() => {
      const scan = service.scheduleQuarterlyScan({ scheduledDate: '2026-04-01' });
      service.executeScan(scan.id);
      scanId = scan.id;
    });

    it('should report a critical vulnerability with 48h SLA', () => {
      const result = service.reportVulnerability({
        scanId,
        title: 'SQL Injection',
        severity: 'critical',
        description: 'SQL injection in login endpoint',
        affectedComponent: 'auth-service',
      });

      expect(result.id).toBeDefined();
      expect(result.severity).toBe('critical');
      expect(result.remediationStatus).toBe('open');
      expect(result.remediationDeadline).toBeInstanceOf(Date);

      const hoursDiff =
        (result.remediationDeadline!.getTime() - result.reportedAt.getTime()) / (1000 * 60 * 60);
      expect(Math.round(hoursDiff)).toBe(CRITICAL_REMEDIATION_SLA_HOURS);
    });

    it('should report a high vulnerability with 48h SLA', () => {
      const result = service.reportVulnerability({
        scanId,
        title: 'XSS Vulnerability',
        severity: 'high',
        description: 'Stored XSS in comments',
        affectedComponent: 'web-app',
      });

      expect(result.remediationDeadline).toBeInstanceOf(Date);
    });

    it('should report a low vulnerability without SLA deadline', () => {
      const result = service.reportVulnerability({
        scanId,
        title: 'Info Disclosure',
        severity: 'low',
        description: 'Server version exposed',
        affectedComponent: 'api-gateway',
      });

      expect(result.remediationDeadline).toBeUndefined();
    });

    it('should throw for non-existent scan', () => {
      expect(() =>
        service.reportVulnerability({
          scanId: 'non-existent',
          title: 'Test',
          severity: 'low',
          description: 'Test',
          affectedComponent: 'test',
        }),
      ).toThrow('not found');
    });

    it('should throw for missing title', () => {
      expect(() =>
        service.reportVulnerability({
          scanId,
          title: '',
          severity: 'low',
          description: 'Test',
          affectedComponent: 'test',
        }),
      ).toThrow('title is required');
    });
  });

  describe('getVulnerabilityReport', () => {
    it('should return report with vulnerability counts', () => {
      const scan = service.scheduleQuarterlyScan({ scheduledDate: '2026-04-01' });
      service.executeScan(scan.id);

      service.reportVulnerability({
        scanId: scan.id,
        title: 'Critical 1',
        severity: 'critical',
        description: 'desc',
        affectedComponent: 'comp',
      });
      service.reportVulnerability({
        scanId: scan.id,
        title: 'High 1',
        severity: 'high',
        description: 'desc',
        affectedComponent: 'comp',
      });
      service.reportVulnerability({
        scanId: scan.id,
        title: 'Low 1',
        severity: 'low',
        description: 'desc',
        affectedComponent: 'comp',
      });

      const report = service.getVulnerabilityReport(scan.id);
      expect(report.vulnerabilities).toHaveLength(3);
      expect(report.criticalCount).toBe(1);
      expect(report.highCount).toBe(1);
      expect(report.mediumCount).toBe(0);
      expect(report.lowCount).toBe(1);
    });

    it('should throw for non-existent scan', () => {
      expect(() => service.getVulnerabilityReport('non-existent')).toThrow('not found');
    });
  });

  describe('trackRemediation', () => {
    let vulnId: string;

    beforeEach(() => {
      const scan = service.scheduleQuarterlyScan({ scheduledDate: '2026-04-01' });
      service.executeScan(scan.id);
      const vuln = service.reportVulnerability({
        scanId: scan.id,
        title: 'Test Vuln',
        severity: 'critical',
        description: 'desc',
        affectedComponent: 'comp',
      });
      vulnId = vuln.id;
    });

    it('should update remediation to in_progress', () => {
      const result = service.trackRemediation({
        vulnerabilityId: vulnId,
        status: 'in_progress',
        notes: 'Working on fix',
      });
      expect(result.remediationStatus).toBe('in_progress');
      expect(result.notes).toBe('Working on fix');
    });

    it('should resolve a vulnerability', () => {
      service.trackRemediation({ vulnerabilityId: vulnId, status: 'in_progress' });
      const result = service.trackRemediation({ vulnerabilityId: vulnId, status: 'resolved' });
      expect(result.remediationStatus).toBe('resolved');
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('should throw if already resolved', () => {
      service.trackRemediation({ vulnerabilityId: vulnId, status: 'resolved' });
      expect(() =>
        service.trackRemediation({ vulnerabilityId: vulnId, status: 'in_progress' }),
      ).toThrow('already resolved');
    });

    it('should throw for non-existent vulnerability', () => {
      expect(() =>
        service.trackRemediation({ vulnerabilityId: 'non-existent', status: 'resolved' }),
      ).toThrow('not found');
    });
  });
});
