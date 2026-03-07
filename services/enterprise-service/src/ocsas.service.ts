import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  OcsasLevel,
  OCSAS_LEVELS,
  OcsasLevelDefinition,
  SecurityConfigItem,
  SecurityAuditReport,
  ComplianceCheckResult,
  ComplianceStandard,
  RiskAssessment,
  RiskSeverity,
  KnownVulnerability,
  VulnerabilityNotification,
} from '@openclaw-club/shared';
import {
  ApplySecurityConfigDto,
  GenerateAuditReportDto,
  ScanVulnerabilitiesDto,
} from './dto/ocsas.dto';

export interface AppliedConfig {
  instanceId: string;
  ocsasLevel: OcsasLevel;
  configItems: SecurityConfigItem[];
  appliedAt: Date;
}

@Injectable()
export class OcsasService {
  private appliedConfigs = new Map<string, AppliedConfig>();
  private auditReports = new Map<string, SecurityAuditReport>();
  private notifications = new Map<string, VulnerabilityNotification>();

  /** Known vulnerability database (simulated) */
  private knownVulnerabilities: KnownVulnerability[] = [
    {
      id: 'CVE-2025-0001',
      name: 'OpenClaw RCE in plugin loader',
      severity: 'critical',
      description: 'Remote code execution via malicious plugin package',
      affectedVersions: ['1.0.0', '1.0.1', '1.1.0'],
      fixRecommendation: 'Upgrade to OpenClaw >= 1.2.0 or disable plugin auto-loading',
      publishedAt: new Date('2025-01-15'),
    },
    {
      id: 'CVE-2025-0042',
      name: 'Token leakage in debug mode',
      severity: 'high',
      description: 'API tokens exposed in debug log output',
      affectedVersions: ['1.0.0', '1.1.0', '1.2.0'],
      fixRecommendation: 'Disable debug mode in production or upgrade to >= 1.2.1',
      publishedAt: new Date('2025-02-20'),
    },
  ];

  /**
   * Get all OCSAS level definitions.
   */
  getLevels(): OcsasLevelDefinition[] {
    return Object.values(OCSAS_LEVELS);
  }

  /**
   * Get a specific OCSAS level definition.
   */
  getLevel(level: OcsasLevel): OcsasLevelDefinition {
    const def = OCSAS_LEVELS[level];
    if (!def) throw new BadRequestException(`Invalid OCSAS level: ${level}`);
    return def;
  }

  /**
   * Apply security configuration to an OpenClaw instance.
   * Req 4.1, 4.2, 4.3, 4.4
   */
  applySecurityConfig(dto: ApplySecurityConfigDto): AppliedConfig {
    if (!dto.instanceId) {
      throw new BadRequestException('instanceId is required');
    }
    const levelDef = this.getLevel(dto.ocsasLevel);

    const config: AppliedConfig = {
      instanceId: dto.instanceId,
      ocsasLevel: dto.ocsasLevel,
      configItems: levelDef.configItems.map((item) => ({ ...item })),
      appliedAt: new Date(),
    };

    this.appliedConfigs.set(dto.instanceId, config);
    return config;
  }

  /**
   * Get the applied config for an instance.
   */
  getAppliedConfig(instanceId: string): AppliedConfig {
    const config = this.appliedConfigs.get(instanceId);
    if (!config) throw new NotFoundException(`No security config applied for instance ${instanceId}`);
    return config;
  }

  /**
   * Generate a security audit report for an instance.
   * Req 4.5
   */
  generateAuditReport(dto: GenerateAuditReportDto): SecurityAuditReport {
    if (!dto.instanceId) {
      throw new BadRequestException('instanceId is required');
    }
    const levelDef = this.getLevel(dto.ocsasLevel);

    const configItems = levelDef.configItems.map((item) => ({ ...item }));
    const complianceResults = this.runComplianceChecks(dto.ocsasLevel);
    const riskAssessments = this.assessRisks(dto.ocsasLevel);

    const hasFailedCompliance = complianceResults.some((c) => !c.passed);
    const hasCriticalRisk = riskAssessments.some((r) => r.severity === 'critical');
    const hasHighRisk = riskAssessments.some((r) => r.severity === 'high');

    let overallStatus: SecurityAuditReport['overallStatus'];
    if (hasCriticalRisk || hasFailedCompliance) {
      overallStatus = 'non_compliant';
    } else if (hasHighRisk) {
      overallStatus = 'partially_compliant';
    } else {
      overallStatus = 'compliant';
    }

    const report: SecurityAuditReport = {
      id: crypto.randomUUID(),
      instanceId: dto.instanceId,
      ocsasLevel: dto.ocsasLevel,
      configItems,
      complianceResults,
      riskAssessments,
      overallStatus,
      generatedAt: new Date(),
    };

    this.auditReports.set(report.id, report);
    return report;
  }

  /**
   * Get an audit report by ID.
   */
  getAuditReport(reportId: string): SecurityAuditReport {
    const report = this.auditReports.get(reportId);
    if (!report) throw new NotFoundException(`Audit report ${reportId} not found`);
    return report;
  }

  /**
   * Scan for known vulnerabilities and notify if any are found.
   * Req 4.6
   */
  scanVulnerabilities(dto: ScanVulnerabilitiesDto): VulnerabilityNotification | null {
    if (!dto.instanceId) {
      throw new BadRequestException('instanceId is required');
    }

    // Simulated: check if instance has known vulnerabilities
    const detected = this.detectVulnerabilities(dto.instanceId);

    if (detected.length === 0) {
      return null;
    }

    const notification: VulnerabilityNotification = {
      id: crypto.randomUUID(),
      instanceId: dto.instanceId,
      vulnerabilities: detected,
      notifiedAt: new Date(),
    };

    this.notifications.set(notification.id, notification);
    return notification;
  }

  /**
   * Get vulnerability notification by ID.
   */
  getNotification(notificationId: string): VulnerabilityNotification {
    const notification = this.notifications.get(notificationId);
    if (!notification) throw new NotFoundException(`Notification ${notificationId} not found`);
    return notification;
  }

  /**
   * List all notifications for an instance.
   */
  listNotifications(instanceId: string): VulnerabilityNotification[] {
    return Array.from(this.notifications.values()).filter((n) => n.instanceId === instanceId);
  }

  // ─── Internal helpers ───

  /**
   * Run compliance checks based on OCSAS level.
   * Level 3 includes GDPR and SOC2 checks.
   */
  private runComplianceChecks(level: OcsasLevel): ComplianceCheckResult[] {
    if (level < 3) return [];

    const standards: ComplianceStandard[] = ['GDPR', 'SOC2'];
    return standards.map((standard) => ({
      standard,
      passed: true, // Simulated: all pass when properly configured
      details: `${standard} compliance verified for Level ${level} configuration`,
    }));
  }

  /**
   * Assess security risks based on OCSAS level.
   * Higher levels have fewer residual risks.
   */
  private assessRisks(level: OcsasLevel): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    if (level < 2) {
      risks.push({
        area: 'Data Transport',
        severity: 'medium',
        description: 'Data transmitted without encryption',
        recommendation: 'Upgrade to OCSAS Level 2 for encrypted transport',
      });
      risks.push({
        area: 'Authentication',
        severity: 'medium',
        description: 'Single-factor authentication only',
        recommendation: 'Upgrade to OCSAS Level 2 for MFA support',
      });
    }

    if (level < 3) {
      risks.push({
        area: 'Network Isolation',
        severity: 'low',
        description: 'No private network isolation configured',
        recommendation: 'Upgrade to OCSAS Level 3 for private network isolation',
      });
    }

    return risks;
  }

  /**
   * Detect known vulnerabilities for an instance (simulated).
   * Returns all known vulnerabilities as a simulation.
   */
  private detectVulnerabilities(_instanceId: string): KnownVulnerability[] {
    // In production, this would check the instance's OpenClaw version
    // against the known vulnerability database.
    return [...this.knownVulnerabilities];
  }

  /**
   * Allow injecting custom vulnerability database for testing.
   */
  setKnownVulnerabilities(vulns: KnownVulnerability[]): void {
    this.knownVulnerabilities = vulns;
  }
}
