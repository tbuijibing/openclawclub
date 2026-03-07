import { PaymentMethod } from '@openclaw-club/shared';

export class ProcessPaymentDto {
  orderId!: string;
  paymentMethod!: PaymentMethod;
}
