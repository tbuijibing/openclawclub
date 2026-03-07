import { OrderService } from './order.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService();
  });

  describe('generateOrderNumber', () => {
    it('should generate order numbers with OC- prefix', () => {
      const num = service.generateOrderNumber();
      expect(num).toMatch(/^OC-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it('should generate unique order numbers', () => {
      const numbers = new Set(
        Array.from({ length: 100 }, () => service.generateOrderNumber()),
      );
      expect(numbers.size).toBe(100);
    });
  });

  describe('createOrder', () => {
    it('should create an order with pending_payment status', () => {
      const order = service.createOrder({
        userId: 'user-1',
        orderType: 'installation',
        totalAmount: 99,
      });

      expect(order.status).toBe('pending_payment');
      expect(order.orderType).toBe('installation');
      expect(order.totalAmount).toBe(99);
      expect(order.currency).toBe('USD');
      expect(order.orderNumber).toMatch(/^OC-/);
    });

    it('should support all order types', () => {
      const types = ['installation', 'subscription', 'course', 'certification', 'hardware'] as const;
      for (const t of types) {
        const order = service.createOrder({
          userId: 'user-1',
          orderType: t,
          totalAmount: 50,
        });
        expect(order.orderType).toBe(t);
      }
    });

    it('should throw on invalid amount', () => {
      expect(() =>
        service.createOrder({ userId: 'u', orderType: 'course', totalAmount: 0 }),
      ).toThrow(BadRequestException);
    });

    it('should throw on invalid order type', () => {
      expect(() =>
        service.createOrder({ userId: 'u', orderType: 'invalid' as any, totalAmount: 10 }),
      ).toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should transition installation order through valid states', () => {
      const order = service.createOrder({
        userId: 'u1',
        orderType: 'installation',
        totalAmount: 299,
      });

      const updated = service.updateStatus(order.id, 'paid_pending_dispatch');
      expect(updated.status).toBe('paid_pending_dispatch');
    });

    it('should reject invalid transitions', () => {
      const order = service.createOrder({
        userId: 'u1',
        orderType: 'installation',
        totalAmount: 99,
      });

      expect(() => service.updateStatus(order.id, 'completed')).toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for unknown order', () => {
      expect(() => service.updateStatus('nonexistent', 'cancelled')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOrder / listOrders', () => {
    it('should retrieve a created order', () => {
      const order = service.createOrder({
        userId: 'u1',
        orderType: 'hardware',
        totalAmount: 500,
      });
      expect(service.getOrder(order.id)).toEqual(order);
    });

    it('should list orders for a user', () => {
      service.createOrder({ userId: 'u1', orderType: 'course', totalAmount: 99 });
      service.createOrder({ userId: 'u1', orderType: 'hardware', totalAmount: 200 });
      service.createOrder({ userId: 'u2', orderType: 'course', totalAmount: 99 });

      expect(service.listOrders('u1')).toHaveLength(2);
      expect(service.listOrders('u2')).toHaveLength(1);
    });
  });

  describe('timeout processing', () => {
    it('should cancel orders pending payment for over 24 hours', () => {
      const order = service.createOrder({
        userId: 'u1',
        orderType: 'installation',
        totalAmount: 99,
      });
      // Manually backdate createdAt
      (order as any).createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const result = service.processTimeouts();
      expect(result.cancelledCount).toBe(1);
      expect(service.getOrder(order.id).status).toBe('cancelled');
    });

    it('should auto-accept orders pending acceptance for over 7 days', () => {
      const order = service.createOrder({
        userId: 'u1',
        orderType: 'installation',
        totalAmount: 99,
      });
      // Walk through states to pending_acceptance
      service.updateStatus(order.id, 'paid_pending_dispatch');
      service.updateStatus(order.id, 'dispatched');
      service.updateStatus(order.id, 'accepted');
      service.updateStatus(order.id, 'assessing');
      service.updateStatus(order.id, 'installing');
      service.updateStatus(order.id, 'configuring');
      service.updateStatus(order.id, 'testing');
      service.updateStatus(order.id, 'pending_acceptance');

      // Backdate updatedAt
      (order as any).updatedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      const result = service.processTimeouts();
      expect(result.autoAcceptedCount).toBe(1);
      expect(service.getOrder(order.id).status).toBe('completed');
    });

    it('should not cancel recent pending_payment orders', () => {
      service.createOrder({
        userId: 'u1',
        orderType: 'course',
        totalAmount: 99,
      });

      const result = service.processTimeouts();
      expect(result.cancelledCount).toBe(0);
    });
  });
});
