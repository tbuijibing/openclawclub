// ─── Hardware Store Service Types ───
// Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7

/** Hardware product categories (Req 16.1, 16.2) */
export type HardwareCategory =
  | 'clawbox_lite'
  | 'clawbox_pro'
  | 'clawbox_enterprise'
  | 'recommended_hardware'
  | 'accessories';

/** Region type for stock and shipping */
export type HardwareRegion = 'apac' | 'na' | 'eu';

/** Hardware order status */
export type HardwareOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/** ClawBox categories for identifying ClawBox products */
export const CLAWBOX_CATEGORIES: HardwareCategory[] = [
  'clawbox_lite',
  'clawbox_pro',
  'clawbox_enterprise',
];

/** Bundle discount percentage when purchasing hardware + installation together (Req 16.7) */
export const BUNDLE_DISCOUNT_PERCENT = 15;

/** Default Token_Hub bonus amount for ClawBox purchases (Req 16.5) */
export const DEFAULT_TOKEN_HUB_BONUS: Record<string, number> = {
  clawbox_lite: 10.0,
  clawbox_pro: 25.0,
  clawbox_enterprise: 50.0,
};

// ─── Shipping & After-Sales Types (Req 16.8, 16.9, 16.10) ───

/** After-sales service types */
export type AfterSalesType = 'return' | 'exchange' | 'warranty_repair' | 'tech_support';

/** Shipping status stages */
export type ShippingStage =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered';

/** After-sales ticket status */
export type AfterSalesStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** Shipping carrier info */
export interface ShippingCarrier {
  name: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

/** Shipping status for an order (Req 16.9) */
export interface ShippingStatus {
  orderId: string;
  stage: ShippingStage;
  carrier: ShippingCarrier;
  estimatedDeliveryDays: number;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  region: HardwareRegion;
  updatedAt: Date;
}

/** After-sales ticket (Req 16.10) */
export interface AfterSalesTicket {
  id: string;
  orderId: string;
  type: AfterSalesType;
  status: AfterSalesStatus;
  reason: string;
  isWithinWarranty: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Regional shipping configuration (Req 16.8) */
export interface RegionalShippingConfig {
  region: HardwareRegion;
  carrier: string;
  estimatedDays: number;
}

/** Shipping config by region */
export const REGIONAL_SHIPPING: RegionalShippingConfig[] = [
  { region: 'apac', carrier: 'SF Express', estimatedDays: 5 },
  { region: 'na', carrier: 'FedEx', estimatedDays: 3 },
  { region: 'eu', carrier: 'DHL', estimatedDays: 4 },
];

/** ClawBox warranty period in months (Req 16.10) */
export const CLAWBOX_WARRANTY_MONTHS = 12;
