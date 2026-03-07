import { InvoiceType } from '@openclaw-club/shared';

export class GenerateInvoiceDto {
  orderId!: string;
  type!: InvoiceType;
}
