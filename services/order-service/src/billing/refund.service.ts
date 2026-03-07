import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RefundStatus } from '@openclaw-club/shared';
import { OrderService, OrderRecord } from '../order.service';
import { PaymentService, PaymentRecord } from '../payment/payment.service';

export interface RefundRecord {
  id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  refundType: 'full' | 'partial';
  createdAt: Date;
  completedAt?: Date;
}

/** Statuses where the engineer has not yet accepted the order */
const PRE_ACCEPTANCE_STATUSES = new Set([
  'pending_payment',
  'paid_pending_dispatch',
  'dispatched',
]);

/** Statuses where service is in progress */
const IN_PROGRESS_STATUSES = new Set([
  'accepted',
  'assessing',
  'installing',
  'configuring',
  'testing',
  'pending_acceptance',
]);

/** Progress weight for partial refund calculation */
const PROGRESS_WEIGHTS: Record<string, number> = {
  accepted: 0.1,
  assessing: 0.2,
  installing: 0.4,
  configuring: 0.6,
  testing: 0.8,
  pending_acceptance: 0.9,
};

@Injectable()
export class RefundService {
  private refunds = new Map<string, RefundRecord>();

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Request a refund.
   * - Before engineer accepts: full refund
   * - During service: partial refund based on progress
   * - Warranty repair > 2 times: full refund (caller must verify)
   */
  requestRefund(orderId: string, reason: string, warrantyRepairCount?: number): RefundRecord {
    const order = this.orderService.getOrder(orderId);
    const payment = this.paymentService.getPaymentByOrderId(orderId);

    if (!payment) {
      throw new NotFoundException(`No payment found for order ${orderId}`);
    }

    if (payment.status !== 'frozen' && payment.status !== 'released') {
      throw new BadRequestException(`Payment is in ${payment.status} status, cannot refund`);
    }

    // Warranty repair > 2 times → full refund
    if (warrantyRepairCount !== undefined && warrantyRepairCount > 2) {
      return this.createRefund(order, payment, payment.amount, 'full', reason);
    }

    // Before engineer accepts → full refund
    if (PRE_ACCEPTANCE_STATUSES.has(order.status)) {
      return this.createRefund(order, payment, payment.amount, 'full', reason);
    }

    // During service → partial refund based on progress
    if (IN_PROGRESS_STATUSES.has(order.status)) {
      const progressWeight = PROGRESS_WEIGHTS[order.status] ?? 0.5;
      const refundAmount = Math.round(payment.amount * (1 - progressWeight) * 100) / 100;
      return this.createRefund(order, payment, refundAmount, 'partial', reason);
    }

    // Completed + released → full refund only if warranty issue
    if (order.status === 'completed' && warrantyRepairCount !== undefined && warrantyRepairCount > 2) {
      return this.createRefund(order, payment, payment.amount, 'full', reason);
    }

    throw new BadRequestException(`Cannot refund order in ${order.status} status`);
  }

  getRefundsByOrderId(orderId: string): RefundRecord[] {
    return Array.from(this.refunds.values()).filter((r) => r.orderId === orderId);
  }

  private createRefund(
    order: OrderRecord,
    payment: PaymentRecord,
    amount: number,
    refundType: 'full' | 'partial',
    reason: string,
  ): RefundRecord {
    const now = new Date();
    const refund: RefundRecord = {
      id: crypto.randomUUID(),
      orderId: order.id,
      paymentId: payment.id,
      amount,
      currency: payment.currency,
      reason,
      status: 'completed',
      refundType,
      createdAt: now,
      completedAt: now,
    };

    // Update payment status
    payment.status = 'refunded';

    // Transition order to refunded
    this.orderService.updateStatus(order.id, 'refunded');

    this.refunds.set(refund.id, refund);
    return refund;
  }
}
