import { OrderType } from '@openclaw-club/shared';

export class CreateOrderDto {
  userId!: string;
  orgId?: string;
  orderType!: OrderType;
  totalAmount!: number;
  currency?: string;
  region?: string;
}
