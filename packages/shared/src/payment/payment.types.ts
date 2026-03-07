import { PaymentMethod, Region } from '../types';

/** Payment status in escrow flow */
export type PaymentStatus = 'pending' | 'frozen' | 'released' | 'refunded' | 'failed';

/** Invoice types */
export type InvoiceType = 'standard' | 'vat';

/** Refund status */
export type RefundStatus = 'pending' | 'approved' | 'completed' | 'rejected';

/** Settlement constants */
export const ENGINEER_SHARE_PERCENT = 80;
export const PLATFORM_SHARE_PERCENT = 20;

/** Regional payment method mapping */
export const REGIONAL_PAYMENT_METHODS: Record<Region, PaymentMethod[]> = {
  apac: ['alipay', 'wechat_pay', 'credit_card'],
  na: ['credit_card', 'paypal'],
  eu: ['sepa', 'credit_card'],
};

/** Get available payment methods for a region */
export function getPaymentMethodsForRegion(region: Region): PaymentMethod[] {
  return REGIONAL_PAYMENT_METHODS[region] ?? ['credit_card'];
}
