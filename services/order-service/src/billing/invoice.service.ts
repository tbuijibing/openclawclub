import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceType } from '@openclaw-club/shared';
import { OrderService } from '../order.service';
import { PaymentService } from '../payment/payment.service';

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderId: string;
  type: InvoiceType;
  amount: number;
  currency: string;
  issuedAt: Date;
  buyerInfo?: { name?: string; taxId?: string };
}

@Injectable()
export class InvoiceService {
  private invoices = new Map<string, InvoiceRecord>();
  private invoicesByOrder = new Map<string, string[]>();

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Generate an invoice for an order.
   * Standard electronic invoice or VAT special invoice.
   */
  generateInvoice(
    orderId: string,
    type: InvoiceType,
    buyerInfo?: { name?: string; taxId?: string },
  ): InvoiceRecord {
    const order = this.orderService.getOrder(orderId);
    const payment = this.paymentService.getPaymentByOrderId(orderId);

    if (!payment) {
      throw new NotFoundException(`No payment found for order ${orderId}`);
    }

    const invoice: InvoiceRecord = {
      id: crypto.randomUUID(),
      invoiceNumber: this.generateInvoiceNumber(),
      orderId,
      type,
      amount: payment.amount,
      currency: payment.currency,
      issuedAt: new Date(),
      buyerInfo,
    };

    this.invoices.set(invoice.id, invoice);
    const existing = this.invoicesByOrder.get(orderId) ?? [];
    existing.push(invoice.id);
    this.invoicesByOrder.set(orderId, existing);

    return invoice;
  }

  getInvoicesByOrderId(orderId: string): InvoiceRecord[] {
    const ids = this.invoicesByOrder.get(orderId) ?? [];
    return ids.map((id) => this.invoices.get(id)!).filter(Boolean);
  }

  private generateInvoiceNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${ts}-${rand}`;
  }
}
