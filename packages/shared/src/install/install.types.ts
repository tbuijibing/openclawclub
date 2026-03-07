import { ServiceTier } from '../types';

/** Install order progress statuses */
export type InstallStatus =
  | 'pending_dispatch'
  | 'accepted'
  | 'assessing'
  | 'installing'
  | 'configuring'
  | 'testing'
  | 'pending_acceptance'
  | 'completed';

/** Valid install status transitions */
export const INSTALL_STATUS_TRANSITIONS: Record<InstallStatus, InstallStatus[]> = {
  pending_dispatch: ['accepted'],
  accepted: ['assessing'],
  assessing: ['installing'],
  installing: ['configuring'],
  configuring: ['testing'],
  testing: ['pending_acceptance'],
  pending_acceptance: ['completed'],
  completed: [],
};

/** Service tier definitions with pricing and features */
export interface ServiceTierDefinition {
  tier: ServiceTier;
  price: number;
  ocsasLevel: 1 | 2 | 3;
  warrantyDays: number;
  features: string[];
}

export const SERVICE_TIERS: Record<ServiceTier, ServiceTierDefinition> = {
  standard: {
    tier: 'standard',
    price: 99,
    ocsasLevel: 1,
    warrantyDays: 30,
    features: [
      'OpenClaw core installation',
      'OCSAS Level 1 security',
      'Common tool integration',
      '30-day warranty',
    ],
  },
  professional: {
    tier: 'professional',
    price: 299,
    ocsasLevel: 2,
    warrantyDays: 90,
    features: [
      'OpenClaw core installation',
      'OCSAS Level 2 security',
      'Personalized skill configuration',
      '90-day warranty',
      'Security audit report',
    ],
  },
  enterprise: {
    tier: 'enterprise',
    price: 999,
    ocsasLevel: 3,
    warrantyDays: 180,
    features: [
      'OpenClaw core installation',
      'OCSAS Level 3 security',
      'Multi-user collaboration',
      'Private model integration',
      'SLA guarantee',
      '180-day warranty',
    ],
  },
};

/** Auto-acceptance window: 7 days */
export const AUTO_ACCEPTANCE_DAYS = 7;

/** Max warranty repairs before quality investigation */
export const MAX_WARRANTY_REPAIRS = 2;

/** Dispatch timeout thresholds in minutes */
export const DISPATCH_EXPAND_TIMEOUT_MINUTES = 30;
export const DISPATCH_MANUAL_TIMEOUT_MINUTES = 60;

// ExternalPlatform is exported from partner module to avoid duplicate exports
// Re-export via install/index.ts if needed
