import { PaymentProvider, ChargeResult, RefundResult } from './payment-provider.interface';

/** Mock Stripe provider (credit_card + paypal) */
export class MockStripeProvider implements PaymentProvider {
  readonly name = 'stripe';

  async charge(amount: number, currency: string): Promise<ChargeResult> {
    return { success: true, externalPaymentId: `stripe_ch_${crypto.randomUUID().slice(0, 8)}` };
  }

  async refund(externalPaymentId: string, amount: number): Promise<RefundResult> {
    return { success: true, externalRefundId: `stripe_re_${crypto.randomUUID().slice(0, 8)}` };
  }
}

/** Mock Alipay provider */
export class MockAlipayProvider implements PaymentProvider {
  readonly name = 'alipay';

  async charge(amount: number, currency: string): Promise<ChargeResult> {
    return { success: true, externalPaymentId: `alipay_${crypto.randomUUID().slice(0, 8)}` };
  }

  async refund(externalPaymentId: string, amount: number): Promise<RefundResult> {
    return { success: true, externalRefundId: `alipay_re_${crypto.randomUUID().slice(0, 8)}` };
  }
}

/** Mock WeChat Pay provider */
export class MockWeChatPayProvider implements PaymentProvider {
  readonly name = 'wechat_pay';

  async charge(amount: number, currency: string): Promise<ChargeResult> {
    return { success: true, externalPaymentId: `wxpay_${crypto.randomUUID().slice(0, 8)}` };
  }

  async refund(externalPaymentId: string, amount: number): Promise<RefundResult> {
    return { success: true, externalRefundId: `wxpay_re_${crypto.randomUUID().slice(0, 8)}` };
  }
}
