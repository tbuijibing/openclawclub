/** Result from a payment provider charge */
export interface ChargeResult {
  success: boolean;
  externalPaymentId: string;
  error?: string;
}

/** Result from a payment provider refund */
export interface RefundResult {
  success: boolean;
  externalRefundId: string;
  error?: string;
}

/** Abstract payment provider — implementations wrap Stripe, Alipay, WeChat, etc. */
export interface PaymentProvider {
  readonly name: string;
  charge(amount: number, currency: string, metadata?: Record<string, string>): Promise<ChargeResult>;
  refund(externalPaymentId: string, amount: number, currency: string): Promise<RefundResult>;
}
