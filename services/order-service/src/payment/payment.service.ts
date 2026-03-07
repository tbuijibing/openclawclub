import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PaymentMethod,
  Region,
  PaymentStatus,
  ENGINEER_SHARE_PERCENT,
  PLATFORM_SHARE_PERCENT,
  getPaymentMethodsForRegion,
} from '@openclaw-club/shared';
import { OrderService, OrderRecord } from '../order.service';
import { PaymentProvider } from './payment-provider.interface';
import { MockStripeProvider, MockAlipayProvider, MockWeChatPayProvider } from './mock-payment.provider';

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  escrowFrozenAt?: Date;
  escrowReleasedAt?: Date;
  externalPaymentId?: string;
  createdAt: Date;
}

export interface SettlementResult {
  orderId: string;
  totalAmount: number;
  engineerShare: number;
  platformShare: number;
  currency: string;
  settledAt: string;
}

@Injectable()
export class PaymentService {
  /** In-memory store — will be replaced by TypeORM repository */
  private payments = new Map<string, PaymentRecord>();
  private paymentsByOrder = new Map<string, string>(); // orderId → paymentId

  private providers: Record<string, PaymentProvider> = {
    credit_card: new MockStripeProvider(),
    paypal: new MockStripeProvider(),
    sepa: new MockStripeProvider(),
    alipay: new MockAlipayProvider(),
    wechat_pay: new MockWeChatPayProvider(),
  };

  constructor(private readonly orderService: OrderService) {}

  /**
   * Get available payment methods for a region.
   */
  getRegionalPaymentMethods(region: Region): PaymentMethod[] {
    return getPaymentMethodsForRegion(region);
  }

  /**
   * Process payment: charge via provider, freeze funds in escrow, update order status.
   */
  async processPayment(orderId: string, paymentMethod: PaymentMethod): Promise<PaymentRecord> {
    const order = this.orderService.getOrder(orderId);

    if (order.status !== 'pending_payment') {
      throw new BadRequestException(`Order ${orderId} is not in pending_payment status`);
    }

    if (this.paymentsByOrder.has(orderId)) {
      throw new BadRequestException(`Payment already exists for order ${orderId}`);
    }

    const provider = this.providers[paymentMethod];
    if (!provider) {
      throw new BadRequestException(`Unsupported payment method: ${paymentMethod}`);
    }

    // Charge via provider
    const chargeResult = await provider.charge(order.totalAmount, order.currency, {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    if (!chargeResult.success) {
      // Create a failed payment record
      const failedPayment = this.createPaymentRecord(order, paymentMethod, 'failed');
      return failedPayment;
    }

    // Freeze funds in escrow
    const now = new Date();
    const payment = this.createPaymentRecord(order, paymentMethod, 'frozen');
    payment.escrowFrozenAt = now;
    payment.externalPaymentId = chargeResult.externalPaymentId;

    // Transition order to paid_pending_dispatch
    this.orderService.updateStatus(orderId, 'paid_pending_dispatch');

    return payment;
  }

  /**
   * Settle order: release escrow funds and split between engineer (80%) and platform (20%).
   */
  settleOrder(orderId: string, engineerId: string): SettlementResult {
    const order = this.orderService.getOrder(orderId);

    if (order.status !== 'completed') {
      throw new BadRequestException(`Order ${orderId} must be in completed status to settle`);
    }

    const payment = this.getPaymentByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException(`No payment found for order ${orderId}`);
    }

    if (payment.status !== 'frozen') {
      throw new BadRequestException(`Payment for order ${orderId} is not in frozen status`);
    }

    // Release escrow
    const now = new Date();
    payment.status = 'released';
    payment.escrowReleasedAt = now;

    // Calculate shares
    const totalAmount = Number(payment.amount);
    const engineerShare = Math.round(totalAmount * ENGINEER_SHARE_PERCENT) / 100;
    const platformShare = Math.round(totalAmount * PLATFORM_SHARE_PERCENT) / 100;

    return {
      orderId,
      totalAmount,
      engineerShare,
      platformShare,
      currency: payment.currency,
      settledAt: now.toISOString(),
    };
  }

  /**
   * Get payment by order ID.
   */
  getPaymentByOrderId(orderId: string): PaymentRecord | undefined {
    const paymentId = this.paymentsByOrder.get(orderId);
    if (!paymentId) return undefined;
    return this.payments.get(paymentId);
  }

  private createPaymentRecord(
    order: OrderRecord,
    paymentMethod: PaymentMethod,
    status: PaymentStatus,
  ): PaymentRecord {
    const payment: PaymentRecord = {
      id: crypto.randomUUID(),
      orderId: order.id,
      paymentMethod,
      amount: order.totalAmount,
      currency: order.currency,
      status,
      createdAt: new Date(),
    };
    this.payments.set(payment.id, payment);
    this.paymentsByOrder.set(order.id, payment.id);
    return payment;
  }
}
