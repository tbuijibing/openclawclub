// ─── Partner Service Types ───
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11

/** Three partner role types (Req 10.1) */
export type PartnerType = 'community' | 'regional' | 'engineer';

/** Partner application status (Req 10.2) */
export type PartnerApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

/** Partner earning status (Req 10.6) */
export type PartnerEarningStatus = 'pending' | 'settled' | 'paid';

/** External vendor status */
export type ExternalVendorStatus = 'active' | 'suspended' | 'converted';

/** External platform identifiers (Req 10.8) */
export type ExternalPlatform = 'fiverr' | 'upwork' | 'zbj' | 'xianyu' | 'other';

/** Revenue share percentages by partner type (Req 10.3, 10.4, 10.5) */
export const REVENUE_SHARE_PERCENTAGES: Record<PartnerType, number> = {
  community: 70,
  regional: 60,
  engineer: 80,
};

/** Application review deadline in business days (Req 10.2) */
export const APPLICATION_REVIEW_BUSINESS_DAYS = 5;

/** Monthly settlement deadline day (Req 10.6) */
export const SETTLEMENT_DEADLINE_DAY = 15;
