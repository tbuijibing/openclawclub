import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from '../order.service';
import { PaymentService } from '../payment/payment.service';
import { RefundService } from './refund.service';
import { InvoiceService } from './invoice.service';
import { SubscriptionBillingService } from './subscription-billing.service';
import { EarningsService } from './earnings.service';
import { ENGINEER_SHARE_PERCENT } from '@openclaw-club/shared';

describe('RefundService', () => {
  let orderService: OrderService;
  let paymentService: PaymentService;
  let refundService: RefundService;

  beforeEach(() => {
    orderService = new OrderService();
    paymentService = new PaymentService(orderService);
    refundService = new RefundService(orderService, paymentService);
  });

  it('should full-refund before engineer accepts (paid_pending_dispatch)', async () => {
    const order = orderService.createOrder({
      userId: 'u1', orderType: 'installation', totalAmount: 299,
    });
    await paymentService.processPayment(order.id, 'credit_card');

    const refund = refundService.requestRefund(order.id, 'changed mind');
    expect(refund.refundType).toBe('full');
    expect(refund.amount).toBe(299);
    expect(refund.status).toBe('completed');
    expect(orderService.getOrder(order.id).status).toBe('refunded');
  });

  it('should partial-refund during service based on progress', async () => {
    const order = orderService.createOrder({
      userId: 'u1', orderType: 'installation', totalAmount: 1000,
    });
    await paymentService.processPayment(order.id, 'credit_card');
    orderService.updateStatus(order.id, 'dispatched');
    orderService.updateStatus(order.id, 'accepted');
    orderService.updateStatus(order.id, 'assessing');
    orderService.updateStatus(order.id, 'installing');

    // installing has 0.4 progress weight → refund = 1000 * (1 - 0.4) = 600
    const refund = refundService.requestRefund(order.id, 'not satisfied');
    expect(refund.refundType).toBe('partial');
    expect(refund.amount).toBe(600);
  });

  it('should full-refund when warranty repair count > 2', async () => {
    const order = orderService.createOrder({
      userId: 'u1', orderType: 'installation', totalAmount: 500,
    });
    await paymentService.processPayment(order.id, 'credit_card');
    orderService.updateStatus(order.id, 'dispatched');
    orderService.updateStatus(order.id, 'accepted');
    orderService.updateStatus(order.id, 'assessing');
    orderService.updateStatus(order.id, 'installing');

    const refund = refundService.requestRefund(order.id, 'warranty issue', 3);
    expect(refund.refundType).toBe('full');
    expect(refund.amount).toBe(500);
  });

  it('should throw when no payment exists', () => {
    const order = orderService.createOrder({
      userId: 'u1', orderType: 'installation', totalAmount: 99,
    });
    expect(() => refundService.requestRefund(order.id, 'test')).toThrow(NotFoundException);
  });
});

describe('InvoiceService', () => {
  let orderService: OrderService;
  let paymentService: PaymentService;
  let invoiceService: InvoiceService;

  beforeEach(() => {
    orderService = new OrderService();
    paymentService = new PaymentService(orderService);
    invoiceService = new InvoiceService(orderService, paymentService);
  });

  it('should generate a standard invoice', async () => {
    const order = orderService.createOrder({
      userId: 'u1', orderType: 'installation', totalAmount: 299,
    });
    await paymentService.processPayment(order.id, 'credit_card');

    const invoice = invoiceService.generateInvoice(order.id, 'standard');
    expect(invoice.type).toBe('standard');
    expect(invoice.amount).toBe(299);
    expect(invoice.invoiceNumber).toMatch(/^INV-/);
  });

  it('should generate a VAT invoice with buyer info', async () => {
    const order = orderService.createOrder({
      userId: 'u1', orderType: 'installation', totalAmount: 999,
    });
    await paymentService.processPayment(order.id, 'credit_card');

    const invoice = invoiceService.generateInvoice(order.id, 'vat', {
      name: 'Acme Corp', taxId: 'EU123456',
    });
    expect(invoice.type).toBe('vat');
    expect(invoice.buyerInfo?.taxId).toBe('EU123456');
  });

  it('should throw when no payment exists', () => {
    const order = orderService.createOrder({
      userId: 'u1', orderType: 'installation', totalAmount: 99,
    });
    expect(() => invoiceService.generateInvoice(order.id, 'standard')).toThrow(NotFoundException);
  });

  it('should list invoices by order', async () => {
    const order = orderService.createOrder({
      userId: 'u1', orderType: 'installation', totalAmount: 299,
    });
    await paymentService.processPayment(order.id, 'credit_card');

    invoiceService.generateInvoice(order.id, 'standard');
    invoiceService.generateInvoice(order.id, 'vat');

    expect(invoiceService.getInvoicesByOrderId(order.id)).toHaveLength(2);
  });
});

describe('SubscriptionBillingService', () => {
  let service: SubscriptionBillingService;

  beforeEach(() => {
    service = new SubscriptionBillingService();
  });

  it('should process auto-charge and mark notification sent', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-02-01');

    const charge = service.processAutoCharge('sub-1', 'user-1', 49, 'USD', start, end);
    expect(charge.amount).toBe(49);
    expect(charge.notificationSent).toBe(true);
    expect(charge.billingPeriodStart).toEqual(start);
    expect(charge.billingPeriodEnd).toEqual(end);
  });

  it('should list charges by subscription', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-02-01');

    service.processAutoCharge('sub-1', 'user-1', 49, 'USD', start, end);
    service.processAutoCharge('sub-1', 'user-1', 49, 'USD', end, new Date('2025-03-01'));
    service.processAutoCharge('sub-2', 'user-2', 79, 'USD', start, end);

    expect(service.getChargesBySubscription('sub-1')).toHaveLength(2);
    expect(service.getChargesBySubscription('sub-2')).toHaveLength(1);
  });
});

describe('EarningsService', () => {
  let service: EarningsService;

  beforeEach(() => {
    service = new EarningsService();
  });

  it('should record an earning with correct 80% share', () => {
    const earning = service.recordEarning('eng-1', 'order-1', 1000, 'USD');
    expect(earning.netAmount).toBe(1000 * ENGINEER_SHARE_PERCENT / 100);
    expect(earning.sharePercentage).toBe(ENGINEER_SHARE_PERCENT);
    expect(earning.status).toBe('settled');
  });

  it('should compute earnings report with pending, settled, escrow', () => {
    service.recordEarning('eng-1', 'o1', 1000, 'USD', 'settled');
    service.recordEarning('eng-1', 'o2', 500, 'USD', 'pending');
    service.recordEarning('eng-1', 'o3', 300, 'USD', 'escrow');
    service.recordEarning('eng-2', 'o4', 200, 'USD', 'settled');

    const report = service.getEngineerEarnings('eng-1');
    expect(report.settledAmount).toBe(1000 * ENGINEER_SHARE_PERCENT / 100);
    expect(report.pendingAmount).toBe(500 * ENGINEER_SHARE_PERCENT / 100);
    expect(report.escrowAmount).toBe(300 * ENGINEER_SHARE_PERCENT / 100);
    expect(report.history).toHaveLength(3);
  });

  it('should return empty report for unknown engineer', () => {
    const report = service.getEngineerEarnings('unknown');
    expect(report.settledAmount).toBe(0);
    expect(report.pendingAmount).toBe(0);
    expect(report.escrowAmount).toBe(0);
    expect(report.history).toHaveLength(0);
  });
});
