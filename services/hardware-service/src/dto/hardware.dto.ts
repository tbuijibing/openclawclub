import type { HardwareCategory, HardwareRegion, AfterSalesType } from '@openclaw-club/shared';

// ─── Product Listing (Req 16.1, 16.2) ───

export interface ListProductsDto {
  category?: HardwareCategory;
  region?: HardwareRegion;
}

export interface GetProductDetailDto {
  productId: string;
}

// ─── Hardware Order (Req 16.3, 16.5, 16.7) ───

export interface HardwareOrderItemDto {
  productId: string;
  quantity: number;
  includeInstallation?: boolean;
}

export interface CreateHardwareOrderDto {
  userId: string;
  items: HardwareOrderItemDto[];
  region?: HardwareRegion;
}

// ─── Shipping & After-Sales (Req 16.8, 16.9, 16.10) ───

export interface GetShippingStatusDto {
  orderId: string;
}

export interface RequestAfterSalesDto {
  orderId: string;
  type: AfterSalesType;
  reason?: string;
}
