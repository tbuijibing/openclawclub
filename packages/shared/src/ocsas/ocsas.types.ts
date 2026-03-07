/** OCSAS (OpenClaw Club Security Audit Standard) levels */
export type OcsasLevel = 1 | 2 | 3;

/** Security configuration item */
export interface SecurityConfigItem {
  name: string;
  description: string;
  enabled: boolean;
}

/** OCSAS level definition */
export interface OcsasLevelDefinition {
  level: OcsasLevel;
  name: string;
  description: string;
  configItems: SecurityConfigItem[];
}

/** Compliance standard types */
export type ComplianceStandard = 'GDPR' | 'SOC2';

/** Compliance check result */
export interface ComplianceCheckResult {
  standard: ComplianceStandard;
  passed: boolean;
  details: string;
}

/** Risk severity */
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Risk assessment entry */
export interface RiskAssessment {
  area: string;
  severity: RiskSeverity;
  description: string;
  recommendation: string;
}

/** Security audit report */
export interface SecurityAuditReport {
  id: string;
  instanceId: string;
  ocsasLevel: OcsasLevel;
  configItems: SecurityConfigItem[];
  complianceResults: ComplianceCheckResult[];
  riskAssessments: RiskAssessment[];
  overallStatus: 'compliant' | 'partially_compliant' | 'non_compliant';
  generatedAt: Date;
}

/** Known vulnerability */
export interface KnownVulnerability {
  id: string;
  name: string;
  severity: RiskSeverity;
  description: string;
  affectedVersions: string[];
  fixRecommendation: string;
  publishedAt: Date;
}

/** Vulnerability notification */
export interface VulnerabilityNotification {
  id: string;
  instanceId: string;
  vulnerabilities: KnownVulnerability[];
  notifiedAt: Date;
}

/** OCSAS Level 1 config items: firewall, basic access control, access logs */
const LEVEL_1_ITEMS: SecurityConfigItem[] = [
  { name: 'firewall', description: 'Firewall configuration for network protection', enabled: true },
  { name: 'basic_access_control', description: 'Basic role-based permission control', enabled: true },
  { name: 'access_logs', description: 'Access logging for all requests', enabled: true },
];

/** OCSAS Level 2 adds: encrypted transport, MFA, security audit logs */
const LEVEL_2_ADDITIONS: SecurityConfigItem[] = [
  { name: 'encrypted_transport', description: 'TLS 1.2+ data encryption in transit', enabled: true },
  { name: 'mfa', description: 'Multi-factor authentication enforcement', enabled: true },
  { name: 'security_audit_logs', description: 'Detailed security event audit logging', enabled: true },
];

/** OCSAS Level 3 adds: private network isolation, compliance checks, intrusion detection */
const LEVEL_3_ADDITIONS: SecurityConfigItem[] = [
  { name: 'private_network_isolation', description: 'Private VPC/network isolation', enabled: true },
  { name: 'compliance_gdpr', description: 'GDPR compliance checks and enforcement', enabled: true },
  { name: 'compliance_soc2', description: 'SOC2 compliance checks and enforcement', enabled: true },
  { name: 'intrusion_detection', description: 'Real-time intrusion detection system', enabled: true },
];

/** Full OCSAS level definitions */
export const OCSAS_LEVELS: Record<OcsasLevel, OcsasLevelDefinition> = {
  1: {
    level: 1,
    name: 'Personal',
    description: 'Basic security for individual users',
    configItems: [...LEVEL_1_ITEMS],
  },
  2: {
    level: 2,
    name: 'Team',
    description: 'Enhanced security for team environments',
    configItems: [...LEVEL_1_ITEMS, ...LEVEL_2_ADDITIONS],
  },
  3: {
    level: 3,
    name: 'Enterprise',
    description: 'Maximum security for enterprise deployments',
    configItems: [...LEVEL_1_ITEMS, ...LEVEL_2_ADDITIONS, ...LEVEL_3_ADDITIONS],
  },
};
