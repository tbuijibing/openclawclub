import { Module } from '@nestjs/common';
import { OrderServiceController } from './order-service.controller';
import { OrderService } from './order.service';
import { PaymentService } from './payment/payment.service';
import { RefundService } from './billing/refund.service';
import { InvoiceService } from './billing/invoice.service';
import { SubscriptionBillingService } from './billing/subscription-billing.service';
import { EarningsService } from './billing/earnings.service';

@Module({
  controllers: [OrderServiceController],
  providers: [
    OrderService,
    PaymentService,
    RefundService,
    InvoiceService,
    SubscriptionBillingService,
    EarningsService,
  ],
  exports: [
    OrderService,
    PaymentService,
    RefundService,
    InvoiceService,
    SubscriptionBillingService,
    EarningsService,
  ],
})
export class OrderServiceModule {}
