/** Configuration pack categories */
export type PackCategory = 'productivity' | 'developer' | 'enterprise';

/** Subscription billing cycles */
export type SubscriptionCycle = 'monthly' | 'yearly';

/** Subscription statuses */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

/** Deploy result statuses */
export type DeployStatus = 'success' | 'failed';

/** Configuration pack definitions with pricing */
export interface PackDefinition {
  category: PackCategory;
  name: string;
  monthlyPrice: number;
  features: string[];
}

export const CONFIGURATION_PACKS: Record<PackCategory, PackDefinition> = {
  productivity: {
    category: 'productivity',
    name: 'Productivity Enhancement Pack',
    monthlyPrice: 49,
    features: [
      'Automated workflow templates',
      'Smart scheduling integration',
      'Document generation tools',
      'Email automation',
    ],
  },
  developer: {
    category: 'developer',
    name: 'Developer Toolkit Pack',
    monthlyPrice: 79,
    features: [
      'Code review automation',
      'CI/CD pipeline templates',
      'API testing tools',
      'Development environment presets',
      'Git workflow automation',
    ],
  },
  enterprise: {
    category: 'enterprise',
    name: 'Enterprise Solutions Pack',
    monthlyPrice: 199,
    features: [
      'Enterprise SSO integration',
      'Advanced analytics dashboard',
      'Custom workflow builder',
      'Compliance reporting',
      'Priority support channel',
      'Multi-team management',
    ],
  },
};

/** Yearly subscription = 10 months price (2 months free) */
export const YEARLY_MONTHS_CHARGED = 10;

/** Days before expiry to send renewal reminder */
export const RENEWAL_REMINDER_DAYS = 7;

/** Days to retain data after cancellation */
export const DATA_RETENTION_DAYS = 30;
