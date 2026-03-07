import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { Region } from '@openclaw-club/shared';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { SettleOrderDto } from './dto/settle-order.dto';
import { RequestRefundDto } from './dto/request-refund.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { PaymentService } from './payment/payment.service';
import { RefundService } from './billing/refund.service';
import { InvoiceService } from './billing/invoice.service';
import { SubscriptionBillingService } from './billing/subscription-billing.service';
import { EarningsService } from './billing/earnings.service';

@Controller('orders')
export class OrderServiceController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
    private readonly invoiceService: InvoiceService,
    private readonly subscriptionBillingService: SubscriptionBillingService,
    private readonly earningsService: EarningsService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'order-service' };
  }

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(dto);
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @Get()
  listOrders(@Query('userId') userId: string) {
    return this.orderService.listOrders(userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, dto.status);
  }

  @Post('process-timeouts')
  processTimeouts() {
    return this.orderService.processTimeouts();
  }

  /* ── Payment endpoints ── */

  @Post('payments/process')
  processPayment(@Body() dto: ProcessPaymentDto) {
    return this.paymentService.processPayment(dto.orderId, dto.paymentMethod);
  }

  @Post('payments/settle')
  settleOrder(@Body() dto: SettleOrderDto) {
    return this.paymentService.settleOrder(dto.orderId, dto.engineerId);
  }

  @Get('payments/methods/:region')
  getRegionalPaymentMethods(@Param('region') region: Region) {
    return this.paymentService.getRegionalPaymentMethods(region);
  }

  @Get('payments/order/:orderId')
  getPaymentByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentByOrderId(orderId);
  }

  /* ── Refund endpoints ── */

  @Post('refunds')
  requestRefund(@Body() dto: RequestRefundDto) {
    return this.refundService.requestRefund(dto.orderId, dto.reason);
  }

  /* ── Invoice endpoints ── */

  @Post('invoices')
  generateInvoice(@Body() dto: GenerateInvoiceDto) {
    return this.invoiceService.generateInvoice(dto.orderId, dto.type);
  }

  @Get('invoices/order/:orderId')
  getInvoicesByOrder(@Param('orderId') orderId: string) {
    return this.invoiceService.getInvoicesByOrderId(orderId);
  }

  /* ── Subscription billing endpoints ── */

  @Post('subscriptions/:subscriptionId/charge')
  processSubscriptionCharge(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { userId: string; amount: number; currency?: string; periodStart: string; periodEnd: string },
  ) {
    return this.subscriptionBillingService.processAutoCharge(
      subscriptionId,
      body.userId,
      body.amount,
      body.currency ?? 'USD',
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }

  /* ── Engineer earnings endpoints ── */

  @Get('earnings/:engineerId')
  getEngineerEarnings(@Param('engineerId') engineerId: string) {
    return this.earningsService.getEngineerEarnings(engineerId);
  }
}
