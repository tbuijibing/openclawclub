import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DataDeletionStatus,
  CookieCategory,
  DataRegion,
  VulnerabilitySeverity,
  ScanStatus,
  RemediationStatus,
  DATA_DELETION_MAX_DAYS,
  CRITICAL_REMEDIATION_SLA_HOURS,
  QUARTERLY_SCAN_INTERVAL_DAYS,
  EU_COUNTRY_CODES,
} from '@openclaw-club/shared';
import {
  RequestDataDeletionDto,
  ProcessDataDeletionDto,
  GetDataDeletionStatusDto,
  RecordCookieConsentDto,
  GetCookieConsentDto,
  UpdateCookieConsentDto,
  GetDataRegionDto,
  ValidateDataResidencyDto,
  ScheduleQuarterlyScanDto,
  ReportVulnerabilityDto,
  TrackRemediationDto,
} from './dto/compliance.dto';

// ─── In-memory record types ───

export interface DataDeletionRequest {
  id: string;
  userId: string;
  reason?: string;
  status: DataDeletionStatus;
  requestedAt: Date;
  deadline: Date;
  completedAt?: Date;
  notifiedAt?: Date;
}

export interface CookieConsentRecord {
  userId: string;
  countryCode: string;
  categories: CookieCategory[];
  isEU: boolean;
  consentedAt: Date;
  updatedAt: Date;
}

export interface DataResidencyRecord {
  userId: string;
  region: DataRegion;
  countryCode: string;
  assignedAt: Date;
}

export interface VulnerabilityScan {
  id: string;
  scheduledDate: string;
  status: ScanStatus;
  startedAt?: Date;
  completedAt?: Date;
  vulnerabilityCount: number;
}

export interface Vulnerability {
  id: string;
  scanId: string;
  title: string;
  severity: VulnerabilitySeverity;
  description: string;
  affectedComponent: string;
  remediationStatus: RemediationStatus;
  remediationDeadline?: Date;
  resolvedAt?: Date;
  reportedAt: Date;
  notes?: string;
}

export interface VulnerabilityReport {
  scan: VulnerabilityScan;
  vulnerabilities: Vulnerability[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

@Injectable()
export class ComplianceService {
  private deletionRequests = new Map<string, DataDeletionRequest>();
  private cookieConsents = new Map<string, CookieConsentRecord>();
  private dataResidency = new Map<string, DataResidencyRecord>();
  private scans = new Map<string, VulnerabilityScan>();
  private vulnerabilities = new Map<string, Vulnerability>();

  // ─── Data Deletion (Req 13.4) ───

  requestDataDeletion(dto: RequestDataDeletionDto): DataDeletionRequest {
    if (!dto.userId) throw new BadRequestException('userId is required');

    // Check for existing pending request
    for (const req of this.deletionRequests.values()) {
      if (req.userId === dto.userId && (req.status === 'pending' || req.status === 'processing')) {
        throw new BadRequestException('A deletion request is already in progress for this user');
      }
    }

    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + DATA_DELETION_MAX_DAYS);

    const request: DataDeletionRequest = {
      id: crypto.randomUUID(),
      userId: dto.userId,
      reason: dto.reason,
      status: 'pending',
      requestedAt: now,
      deadline,
    };

    this.deletionRequests.set(request.id, request);
    return request;
  }

  processDataDeletion(dto: ProcessDataDeletionDto): DataDeletionRequest {
    const request = this.deletionRequests.get(dto.requestId);
    if (!request) throw new NotFoundException(`Deletion request ${dto.requestId} not found`);

    if (request.status === 'completed') {
      throw new BadRequestException('Deletion request already completed');
    }
    if (request.status === 'failed') {
      throw new BadRequestException('Deletion request has failed, please create a new request');
    }

    const now = new Date();

    // Check if within 30-day deadline
    if (now > request.deadline) {
      request.status = 'failed';
      this.deletionRequests.set(request.id, request);
      throw new BadRequestException('Deletion deadline has passed');
    }

    request.status = 'completed';
    request.completedAt = now;
    request.notifiedAt = now; // User notified upon completion
    this.deletionRequests.set(request.id, request);

    // Clean up related data
    this.cookieConsents.delete(request.userId);
    this.dataResidency.delete(request.userId);

    return request;
  }

  getDataDeletionStatus(dto: GetDataDeletionStatusDto): DataDeletionRequest {
    const request = this.deletionRequests.get(dto.requestId);
    if (!request) throw new NotFoundException(`Deletion request ${dto.requestId} not found`);
    return request;
  }

  // ─── Cookie Consent (Req 13.7) ───

  recordCookieConsent(dto: RecordCookieConsentDto): CookieConsentRecord {
    if (!dto.userId) throw new BadRequestException('userId is required');
    if (!dto.countryCode) throw new BadRequestException('countryCode is required');
    if (!dto.categories || dto.categories.length === 0) {
      throw new BadRequestException('At least one cookie category is required');
    }

    const isEU = this.isEUCountry(dto.countryCode);

    // EU users must explicitly consent — essential is always required
    if (isEU && !dto.categories.includes('essential')) {
      throw new BadRequestException('Essential cookies must be included for EU users');
    }

    const now = new Date();
    const record: CookieConsentRecord = {
      userId: dto.userId,
      countryCode: dto.countryCode,
      categories: dto.categories,
      isEU,
      consentedAt: now,
      updatedAt: now,
    };

    this.cookieConsents.set(dto.userId, record);
    return record;
  }

  getCookieConsent(dto: GetCookieConsentDto): CookieConsentRecord {
    const record = this.cookieConsents.get(dto.userId);
    if (!record) throw new NotFoundException(`Cookie consent not found for user ${dto.userId}`);
    return record;
  }

  updateCookieConsent(dto: UpdateCookieConsentDto): CookieConsentRecord {
    const existing = this.cookieConsents.get(dto.userId);
    if (!existing) throw new NotFoundException(`Cookie consent not found for user ${dto.userId}`);

    if (!dto.categories || dto.categories.length === 0) {
      throw new BadRequestException('At least one cookie category is required');
    }

    if (existing.isEU && !dto.categories.includes('essential')) {
      throw new BadRequestException('Essential cookies must be included for EU users');
    }

    existing.categories = dto.categories;
    existing.updatedAt = new Date();
    this.cookieConsents.set(dto.userId, existing);
    return existing;
  }

  // ─── Data Isolation (Req 8.5) ───

  getDataRegion(dto: GetDataRegionDto): DataRegion {
    if (!dto.countryCode) throw new BadRequestException('countryCode is required');

    if (this.isEUCountry(dto.countryCode)) return 'eu';

    const apacCodes = ['CN', 'JP', 'KR', 'AU', 'NZ', 'SG', 'IN', 'TH', 'VN', 'MY', 'ID', 'PH', 'TW', 'HK'];
    if (apacCodes.includes(dto.countryCode.toUpperCase())) return 'apac';

    return 'na'; // Default to NA for other regions
  }

  assignDataResidency(userId: string, countryCode: string): DataResidencyRecord {
    if (!userId) throw new BadRequestException('userId is required');
    if (!countryCode) throw new BadRequestException('countryCode is required');

    const region = this.getDataRegion({ countryCode });
    const record: DataResidencyRecord = {
      userId,
      region,
      countryCode: countryCode.toUpperCase(),
      assignedAt: new Date(),
    };

    this.dataResidency.set(userId, record);
    return record;
  }

  validateDataResidency(dto: ValidateDataResidencyDto): { valid: boolean; reason?: string } {
    const record = this.dataResidency.get(dto.userId);
    if (!record) {
      return { valid: false, reason: 'No data residency record found for user' };
    }

    // EU data must stay in EU region
    if (record.region === 'eu' && dto.targetRegion !== 'eu') {
      return {
        valid: false,
        reason: 'EU user data cannot be transferred outside the EU region (GDPR)',
      };
    }

    return { valid: true };
  }

  // ─── Vulnerability Scanning (Req 13.5) ───

  scheduleQuarterlyScan(dto: ScheduleQuarterlyScanDto): VulnerabilityScan {
    if (!dto.scheduledDate) throw new BadRequestException('scheduledDate is required');

    const scheduledDate = new Date(dto.scheduledDate);
    if (isNaN(scheduledDate.getTime())) throw new BadRequestException('Invalid scheduledDate');

    const scan: VulnerabilityScan = {
      id: crypto.randomUUID(),
      scheduledDate: dto.scheduledDate,
      status: 'scheduled',
      vulnerabilityCount: 0,
    };

    this.scans.set(scan.id, scan);
    return scan;
  }

  executeScan(scanId: string): VulnerabilityScan {
    const scan = this.scans.get(scanId);
    if (!scan) throw new NotFoundException(`Scan ${scanId} not found`);

    if (scan.status !== 'scheduled') {
      throw new BadRequestException(`Scan is in ${scan.status} state, cannot execute`);
    }

    scan.status = 'running';
    scan.startedAt = new Date();
    this.scans.set(scanId, scan);
    return scan;
  }

  completeScan(scanId: string): VulnerabilityScan {
    const scan = this.scans.get(scanId);
    if (!scan) throw new NotFoundException(`Scan ${scanId} not found`);

    if (scan.status !== 'running') {
      throw new BadRequestException(`Scan is in ${scan.status} state, cannot complete`);
    }

    scan.status = 'completed';
    scan.completedAt = new Date();

    // Count vulnerabilities for this scan
    let count = 0;
    for (const v of this.vulnerabilities.values()) {
      if (v.scanId === scanId) count++;
    }
    scan.vulnerabilityCount = count;

    this.scans.set(scanId, scan);
    return scan;
  }

  reportVulnerability(dto: ReportVulnerabilityDto): Vulnerability {
    const scan = this.scans.get(dto.scanId);
    if (!scan) throw new NotFoundException(`Scan ${dto.scanId} not found`);

    if (!dto.title) throw new BadRequestException('title is required');
    if (!dto.severity) throw new BadRequestException('severity is required');
    if (!dto.affectedComponent) throw new BadRequestException('affectedComponent is required');

    const validSeverities: VulnerabilitySeverity[] = ['critical', 'high', 'medium', 'low'];
    if (!validSeverities.includes(dto.severity)) {
      throw new BadRequestException(`Invalid severity: ${dto.severity}`);
    }

    const now = new Date();
    let remediationDeadline: Date | undefined;

    // Critical/high vulnerabilities get 48-hour SLA
    if (dto.severity === 'critical' || dto.severity === 'high') {
      remediationDeadline = new Date(now);
      remediationDeadline.setHours(remediationDeadline.getHours() + CRITICAL_REMEDIATION_SLA_HOURS);
    }

    const vulnerability: Vulnerability = {
      id: crypto.randomUUID(),
      scanId: dto.scanId,
      title: dto.title,
      severity: dto.severity,
      description: dto.description,
      affectedComponent: dto.affectedComponent,
      remediationStatus: 'open',
      remediationDeadline,
      reportedAt: now,
    };

    this.vulnerabilities.set(vulnerability.id, vulnerability);
    return vulnerability;
  }

  getVulnerabilityReport(scanId: string): VulnerabilityReport {
    const scan = this.scans.get(scanId);
    if (!scan) throw new NotFoundException(`Scan ${scanId} not found`);

    const vulns: Vulnerability[] = [];
    for (const v of this.vulnerabilities.values()) {
      if (v.scanId === scanId) vulns.push(v);
    }

    return {
      scan,
      vulnerabilities: vulns,
      criticalCount: vulns.filter((v) => v.severity === 'critical').length,
      highCount: vulns.filter((v) => v.severity === 'high').length,
      mediumCount: vulns.filter((v) => v.severity === 'medium').length,
      lowCount: vulns.filter((v) => v.severity === 'low').length,
    };
  }

  trackRemediation(dto: TrackRemediationDto): Vulnerability {
    const vuln = this.vulnerabilities.get(dto.vulnerabilityId);
    if (!vuln) throw new NotFoundException(`Vulnerability ${dto.vulnerabilityId} not found`);

    if (vuln.remediationStatus === 'resolved') {
      throw new BadRequestException('Vulnerability is already resolved');
    }

    const validStatuses: RemediationStatus[] = ['in_progress', 'resolved'];
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException(`Invalid status: ${dto.status}. Allowed: in_progress, resolved`);
    }

    vuln.remediationStatus = dto.status;
    if (dto.notes) vuln.notes = dto.notes;

    if (dto.status === 'resolved') {
      vuln.resolvedAt = new Date();
    }

    // Check if overdue (critical/high past 48h deadline)
    if (
      vuln.remediationDeadline &&
      dto.status !== 'resolved' &&
      new Date() > vuln.remediationDeadline
    ) {
      vuln.remediationStatus = 'overdue';
    }

    this.vulnerabilities.set(dto.vulnerabilityId, vuln);
    return vuln;
  }

  // ─── Helpers ───

  private isEUCountry(countryCode: string): boolean {
    return (EU_COUNTRY_CODES as readonly string[]).includes(countryCode.toUpperCase());
  }
}
