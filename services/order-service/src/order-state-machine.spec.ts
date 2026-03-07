import { OrderStateMachine, InvalidTransitionError } from './order-state-machine';
import { OrderStatus, OrderType } from '@openclaw-club/shared/src/order/order.types';

describe('OrderStateMachine', () => {
  describe('installation order transitions', () => {
    const type: OrderType = 'installation';

    const validChain: OrderStatus[] = [
      'pending_payment',
      'paid_pending_dispatch',
      'dispatched',
      'accepted',
      'assessing',
      'installing',
      'configuring',
      'testing',
      'pending_acceptance',
      'completed',
    ];

    it('should allow the full happy-path chain', () => {
      for (let i = 0; i < validChain.length - 1; i++) {
        expect(
          OrderStateMachine.isValidTransition(type, validChain[i], validChain[i + 1]),
        ).toBe(true);
      }
    });

    it('should allow cancellation from pending_payment', () => {
      expect(
        OrderStateMachine.isValidTransition(type, 'pending_payment', 'cancelled'),
      ).toBe(true);
    });

    it('should allow refund from paid_pending_dispatch', () => {
      expect(
        OrderStateMachine.isValidTransition(type, 'paid_pending_dispatch', 'refunded'),
      ).toBe(true);
    });

    it('should reject backward transitions', () => {
      expect(
        OrderStateMachine.isValidTransition(type, 'installing', 'accepted'),
      ).toBe(false);
    });

    it('should reject skipping states', () => {
      expect(
        OrderStateMachine.isValidTransition(type, 'pending_payment', 'completed'),
      ).toBe(false);
    });

    it('should not allow transitions from terminal states', () => {
      expect(OrderStateMachine.getNextStates(type, 'cancelled')).toEqual([]);
      expect(OrderStateMachine.getNextStates(type, 'refunded')).toEqual([]);
    });

    it('transition() should throw InvalidTransitionError on invalid move', () => {
      expect(() =>
        OrderStateMachine.transition(type, 'completed', 'pending_payment'),
      ).toThrow(InvalidTransitionError);
    });

    it('transition() should return the new status on valid move', () => {
      const result = OrderStateMachine.transition(
        type,
        'pending_payment',
        'paid_pending_dispatch',
      );
      expect(result).toBe('paid_pending_dispatch');
    });
  });

  describe('simple order transitions (subscription, course, etc.)', () => {
    const types: OrderType[] = ['subscription', 'course', 'certification', 'hardware'];

    for (const type of types) {
      it(`should allow pending_payment → paid_pending_dispatch for ${type}`, () => {
        expect(
          OrderStateMachine.isValidTransition(type, 'pending_payment', 'paid_pending_dispatch'),
        ).toBe(true);
      });

      it(`should allow paid_pending_dispatch → completed for ${type}`, () => {
        expect(
          OrderStateMachine.isValidTransition(type, 'paid_pending_dispatch', 'completed'),
        ).toBe(true);
      });

      it(`should reject skipping to installing for ${type}`, () => {
        expect(
          OrderStateMachine.isValidTransition(type, 'pending_payment', 'installing' as OrderStatus),
        ).toBe(false);
      });
    }
  });
});
