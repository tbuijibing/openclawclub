/** Supported languages */
export type SupportedLanguage = 'zh' | 'en' | 'ja' | 'ko' | 'de' | 'fr' | 'es';

/** Service regions */
export type Region = 'apac' | 'na' | 'eu';

/** User account types */
export type AccountType = 'individual' | 'enterprise';

/** Platform role types */
export type RoleType =
  | 'admin'
  | 'support_agent'
  | 'trainer'
  | 'certified_engineer'
  | 'partner_community'
  | 'partner_regional'
  | 'enterprise_user'
  | 'individual_user';

/** Order types */
export type OrderType = 'installation' | 'subscription' | 'course' | 'certification' | 'hardware';

/** Payment methods */
export type PaymentMethod =
  | 'credit_card'
  | 'paypal'
  | 'alipay'
  | 'wechat_pay'
  | 'bank_transfer'
  | 'sepa';

/** Installation service tiers */
export type ServiceTier = 'standard' | 'professional' | 'enterprise';

/** Certification types */
export type CertType = 'OCP' | 'OCE' | 'OCEA' | 'AI_IMPLEMENTATION_ENGINEER';
