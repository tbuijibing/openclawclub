import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, OrderType } from '@openclaw-club/shared';
import { OrderStateMachine, InvalidTransitionError } from './order-state-machine';
import { CreateOrderDto } from './dto/create-order.dto';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  orgId?: string;
  orderType: OrderType;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  region?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OrderService {
  /** In-memory store — will be replaced by TypeORM repository */
  private orders = new Map<string, OrderRecord>();

  /**
   * Generate a unique order number: OC-{timestamp}-{random}
   */
  generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `OC-${timestamp}-${random}`;
  }

  /**
   * Create a new order.
   */
  createOrder(dto: CreateOrderDto): OrderRecord {
    if (dto.totalAmount <= 0) {
      throw new BadRequestException('Total amount must be greater than 0');
    }

    const validTypes: OrderType[] = [
      'installation', 'subscription', 'course', 'certification', 'hardware',
    ];
    if (!validTypes.includes(dto.orderType)) {
      throw new BadRequestException(`Invalid order type: ${dto.orderType}`);
    }

    const now = new Date();
    const order: OrderRecord = {
      id: crypto.randomUUID(),
      orderNumber: this.generateOrderNumber(),
      userId: dto.userId,
      orgId: dto.orgId,
      orderType: dto.orderType,
      status: 'pending_payment',
      totalAmount: dto.totalAmount,
      currency: dto.currency ?? 'USD',
      region: dto.region,
      createdAt: now,
      updatedAt: now,
    };

    this.orders.set(order.id, order);
    return order;
  }

  /**
   * Transition order to a new status using the state machine.
   */
  updateStatus(orderId: string, newStatus: OrderStatus): OrderRecord {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    try {
      OrderStateMachine.transition(order.orderType, order.status, newStatus);
    } catch (err) {
      if (err instanceof InvalidTransitionError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    order.status = newStatus;
    order.updatedAt = new Date();
    return order;
  }

  /**
   * Get order by ID.
   */
  getOrder(orderId: string): OrderRecord {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  /**
   * List orders for a user.
   */
  listOrders(userId: string): OrderRecord[] {
    return Array.from(this.orders.values()).filter((o) => o.userId === userId);
  }

  /**
   * Find orders that are pending_payment and older than 24 hours — candidates for cancellation.
   */
  findExpiredPaymentOrders(): OrderRecord[] {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return Array.from(this.orders.values()).filter(
      (o) => o.status === 'pending_payment' && o.createdAt < cutoff,
    );
  }

  /**
   * Find orders in pending_acceptance for more than 7 days — auto-confirm.
   */
  findAutoAcceptanceOrders(): OrderRecord[] {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return Array.from(this.orders.values()).filter(
      (o) => o.status === 'pending_acceptance' && o.updatedAt < cutoff,
    );
  }

  /**
   * Process timeout: cancel expired payment orders and auto-confirm acceptance.
   * Returns counts of processed orders.
   */
  processTimeouts(): { cancelledCount: number; autoAcceptedCount: number } {
    let cancelledCount = 0;
    let autoAcceptedCount = 0;

    for (const order of this.findExpiredPaymentOrders()) {
      order.status = 'cancelled';
      order.updatedAt = new Date();
      cancelledCount++;
    }

    for (const order of this.findAutoAcceptanceOrders()) {
      order.status = 'completed';
      order.updatedAt = new Date();
      autoAcceptedCount++;
    }

    return { cancelledCount, autoAcceptedCount };
  }
}
