import {
  OrderStatus,
  OrderType,
  INSTALL_ORDER_TRANSITIONS,
  SIMPLE_ORDER_TRANSITIONS,
} from '@openclaw-club/shared';

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly orderType: string,
  ) {
    super(
      `Invalid state transition from '${from}' to '${to}' for order type '${orderType}'`,
    );
    this.name = 'InvalidTransitionError';
  }
}

export class OrderStateMachine {
  private static getTransitions(
    orderType: OrderType,
  ): Record<string, OrderStatus[]> {
    return orderType === 'installation'
      ? INSTALL_ORDER_TRANSITIONS
      : SIMPLE_ORDER_TRANSITIONS;
  }

  /**
   * Check if a state transition is valid for the given order type.
   */
  static isValidTransition(
    orderType: OrderType,
    from: OrderStatus,
    to: OrderStatus,
  ): boolean {
    const transitions = this.getTransitions(orderType);
    const allowed = transitions[from];
    if (!allowed) return false;
    return allowed.includes(to);
  }

  /**
   * Validate and return the new status, or throw InvalidTransitionError.
   */
  static transition(
    orderType: OrderType,
    from: OrderStatus,
    to: OrderStatus,
  ): OrderStatus {
    if (!this.isValidTransition(orderType, from, to)) {
      throw new InvalidTransitionError(from, to, orderType);
    }
    return to;
  }

  /**
   * Get all valid next states from the current status.
   */
  static getNextStates(
    orderType: OrderType,
    current: OrderStatus,
  ): OrderStatus[] {
    const transitions = this.getTransitions(orderType);
    return transitions[current] ?? [];
  }
}
