/** Order status values */
export type OrderStatus =
  | 'pending_payment'
  | 'paid_pending_dispatch'
  | 'dispatched'
  | 'accepted'
  | 'assessing'
  | 'installing'
  | 'configuring'
  | 'testing'
  | 'pending_acceptance'
  | 'completed'
  | 'cancelled'
  | 'refunded';

/** Re-export OrderType from shared types */
export type { OrderType } from '../types';

/** Valid state transitions for installation orders */
export const INSTALL_ORDER_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending_payment: ['paid_pending_dispatch', 'cancelled'],
  paid_pending_dispatch: ['dispatched', 'cancelled', 'refunded'],
  dispatched: ['accepted', 'cancelled', 'refunded'],
  accepted: ['assessing', 'cancelled', 'refunded'],
  assessing: ['installing', 'cancelled', 'refunded'],
  installing: ['configuring', 'cancelled', 'refunded'],
  configuring: ['testing', 'cancelled', 'refunded'],
  testing: ['pending_acceptance', 'cancelled', 'refunded'],
  pending_acceptance: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

/** Simple orders (subscription, course, certification, hardware) have a simpler flow */
export const SIMPLE_ORDER_TRANSITIONS: Record<string, OrderStatus[]> = {
  pending_payment: ['paid_pending_dispatch', 'cancelled'],
  paid_pending_dispatch: ['completed', 'cancelled', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};
