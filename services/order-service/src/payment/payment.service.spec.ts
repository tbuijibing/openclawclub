import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { OrderService } from '../order.service';
import { ENGINEER_SHARE_PERCENT, PLATFORM_SHARE_PERCENT } from '@openclaw-club/shared';

describe('PaymentService', () => {
  let orderService: OrderService;
  let paymentService: PaymentService;

  beforeEach(() => {
    orderService = new OrderService();
    paymentService = new PaymentService(orderService);
  });

  describe('getRegionalPaymentMethods', () => {
    it('should return alipay/wechat_pay for APAC', () => {
      const methods = paymentService.getRegionalPaymentMethods('apac');
      expect(methods).toContain('alipay');
      expect(methods).toContain('wechat_pay');
    });

    it('should return credit_card/paypal for NA', () => {
      const methods = paymentService.getRegionalPaymentMethods('na');
      expect(methods).toContain('credit_card');
      expect(methods).toContain('paypal');
    });

    it('should return sepa/credit_card for EU', () => {
      const methods = paymentService.getRegionalPaymentMethods('eu');
      expect(methods).toContain('sepa');
      expect(methods).toContain('credit_card');
    });
  });

  describe('processPayment', () => {
    it('should freeze funds in escrow and transition order to paid_pending_dispatch', async () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 299,
      });

      const payment = await paymentService.processPayment(order.id, 'credit_card');

      expect(payment.status).toBe('frozen');
      expect(payment.escrowFrozenAt).toBeDefined();
      expect(payment.externalPaymentId).toBeDefined();
      expect(payment.amount).toBe(299);

      // Order should be transitioned
      const updatedOrder = orderService.getOrder(order.id);
      expect(updatedOrder.status).toBe('paid_pending_dispatch');
    });

    it('should reject payment for non-pending_payment orders', async () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 99,
      });
      // Transition to paid
      await paymentService.processPayment(order.id, 'credit_card');

      await expect(
        paymentService.processPayment(order.id, 'credit_card'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported payment methods', async () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 99,
      });

      await expect(
        paymentService.processPayment(order.id, 'bank_transfer' as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should work with alipay', async () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 99,
      });

      const payment = await paymentService.processPayment(order.id, 'alipay');
      expect(payment.status).toBe('frozen');
      expect(payment.externalPaymentId).toMatch(/^alipay_/);
    });

    it('should work with wechat_pay', async () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 99,
      });

      const payment = await paymentService.processPayment(order.id, 'wechat_pay');
      expect(payment.status).toBe('frozen');
      expect(payment.externalPaymentId).toMatch(/^wxpay_/);
    });
  });

  describe('settleOrder', () => {
    it('should release escrow and split 80/20 between engineer and platform', async () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 1000,
      });

      await paymentService.processPayment(order.id, 'credit_card');

      // Walk order to completed
      orderService.updateStatus(order.id, 'dispatched');
      orderService.updateStatus(order.id, 'accepted');
      orderService.updateStatus(order.id, 'assessing');
      orderService.updateStatus(order.id, 'installing');
      orderService.updateStatus(order.id, 'configuring');
      orderService.updateStatus(order.id, 'testing');
      orderService.updateStatus(order.id, 'pending_acceptance');
      orderService.updateStatus(order.id, 'completed');

      const result = paymentService.settleOrder(order.id, 'engineer-1');

      expect(result.totalAmount).toBe(1000);
      expect(result.engineerShare).toBe(1000 * ENGINEER_SHARE_PERCENT / 100);
      expect(result.platformShare).toBe(1000 * PLATFORM_SHARE_PERCENT / 100);
      expect(result.engineerShare + result.platformShare).toBe(result.totalAmount);

      // Payment should be released
      const payment = paymentService.getPaymentByOrderId(order.id);
      expect(payment!.status).toBe('released');
      expect(payment!.escrowReleasedAt).toBeDefined();
    });

    it('should reject settlement for non-completed orders', async () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 299,
      });

      await paymentService.processPayment(order.id, 'credit_card');

      expect(() => paymentService.settleOrder(order.id, 'eng-1')).toThrow(
        BadRequestException,
      );
    });

    it('should reject settlement when no payment exists', () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 99,
      });
      // Force status to completed without payment
      (order as any).status = 'completed';

      expect(() => paymentService.settleOrder(order.id, 'eng-1')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should return undefined for orders without payment', () => {
      expect(paymentService.getPaymentByOrderId('nonexistent')).toBeUndefined();
    });

    it('should return payment after processing', async () => {
      const order = orderService.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 99,
      });

      await paymentService.processPayment(order.id, 'credit_card');
      const payment = paymentService.getPaymentByOrderId(order.id);

      expect(payment).toBeDefined();
      expect(payment!.orderId).toBe(order.id);
    });
  });
});
