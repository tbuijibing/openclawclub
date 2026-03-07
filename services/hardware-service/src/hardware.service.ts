import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  HardwareCategory,
  HardwareRegion,
  HardwareOrderStatus,
  CLAWBOX_CATEGORIES,
  BUNDLE_DISCOUNT_PERCENT,
  DEFAULT_TOKEN_HUB_BONUS,
  REGIONAL_SHIPPING,
  CLAWBOX_WARRANTY_MONTHS,
} from '@openclaw-club/shared';
import type {
  AfterSalesType,
  ShippingStatus,
  ShippingStage,
  AfterSalesTicket,
  AfterSalesStatus,
} from '@openclaw-club/shared';
import {
  ListProductsDto,
  GetProductDetailDto,
  CreateHardwareOrderDto,
  GetShippingStatusDto,
  RequestAfterSalesDto,
} from './dto/hardware.dto';

// ─── In-memory record types ───

export interface HardwareProduct {
  id: string;
  category: HardwareCategory;
  name: Record<string, string>;        // e.g. { en: "ClawBox Lite", zh: "ClawBox 轻量版" }
  description: Record<string, string>;
  specs: Record<string, unknown>;       // hardware specifications
  preinstalledSoftware: string[] | null;
  tokenHubBonusAmount: number | null;
  price: number;
  stockByRegion: Record<string, number>;
  isActive: boolean;
  createdAt: Date;
}

export interface ProductDetail extends HardwareProduct {
  warrantyMonths: number;
  setupGuideUrl: string | null;
}

export interface TokenHubAccount {
  id: string;
  userId: string;
  bonusAmount: number;
  createdAt: Date;
}

export interface HardwareOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  includeInstallation: boolean;
  lineTotal: number;
}

export interface HardwareOrder {
  id: string;
  orderNumber: string;
  userId: string;
  items: HardwareOrderItem[];
  subtotal: number;
  bundleDiscount: number;
  totalAmount: number;
  currency: string;
  region: HardwareRegion | null;
  status: HardwareOrderStatus;
  tokenHubAccountsCreated: TokenHubAccount[];
  createdAt: Date;
}


@Injectable()
export class HardwareService {
  private products = new Map<string, HardwareProduct>();
  private orders = new Map<string, HardwareOrder>();
  private tokenHubAccounts = new Map<string, TokenHubAccount>();
  private shippingStatuses = new Map<string, ShippingStatus>();
  private afterSalesTickets = new Map<string, AfterSalesTicket>();

  // ─── Seed default products for testing ───

  constructor() {
    this.seedProducts();
  }

  private seedProducts(): void {
    const defaults: Omit<HardwareProduct, 'id' | 'createdAt'>[] = [
      {
        category: 'clawbox_lite',
        name: { en: 'ClawBox Lite', zh: 'ClawBox 轻量版' },
        description: { en: 'Personal AI assistant, compact and affordable', zh: '个人AI助手，小巧实惠' },
        specs: { cpu: 'Intel N100', ram: '8GB', storage: '256GB SSD', gpu: 'Integrated' },
        preinstalledSoftware: ['OpenClaw Latest', 'Token_Hub Gateway', 'OCSAS L2', 'Basic Config Pack'],
        tokenHubBonusAmount: DEFAULT_TOKEN_HUB_BONUS.clawbox_lite,
        price: 299,
        stockByRegion: { apac: 200, na: 100, eu: 80 },
        isActive: true,
      },
      {
        category: 'clawbox_pro',
        name: { en: 'ClawBox Pro', zh: 'ClawBox 专业版' },
        description: { en: 'Professional AI workstation for teams', zh: '团队专业AI工作站' },
        specs: { cpu: 'Intel i5-13500', ram: '32GB', storage: '1TB NVMe', gpu: 'NVIDIA RTX 4060' },
        preinstalledSoftware: ['OpenClaw Latest', 'Token_Hub Gateway', 'OCSAS L2', 'Developer Config Pack'],
        tokenHubBonusAmount: DEFAULT_TOKEN_HUB_BONUS.clawbox_pro,
        price: 899,
        stockByRegion: { apac: 100, na: 60, eu: 40 },
        isActive: true,
      },
      {
        category: 'clawbox_enterprise',
        name: { en: 'ClawBox Enterprise', zh: 'ClawBox 企业版' },
        description: { en: 'Enterprise-grade AI server with full security', zh: '企业级AI服务器，全面安全配置' },
        specs: { cpu: 'Intel Xeon W5-2465X', ram: '128GB ECC', storage: '4TB NVMe RAID', gpu: 'NVIDIA RTX 4090' },
        preinstalledSoftware: ['OpenClaw Latest', 'Token_Hub Gateway', 'OCSAS L3', 'Enterprise Config Pack'],
        tokenHubBonusAmount: DEFAULT_TOKEN_HUB_BONUS.clawbox_enterprise,
        price: 3999,
        stockByRegion: { apac: 30, na: 20, eu: 15 },
        isActive: true,
      },
      {
        category: 'recommended_hardware',
        name: { en: 'Mac Mini M4', zh: 'Mac Mini M4' },
        description: { en: 'Apple Mac Mini - recommended for OpenClaw', zh: 'Apple Mac Mini - 推荐用于 OpenClaw' },
        specs: { cpu: 'Apple M4', ram: '16GB', storage: '512GB SSD' },
        preinstalledSoftware: null,
        tokenHubBonusAmount: null,
        price: 599,
        stockByRegion: { apac: 50, na: 80, eu: 60 },
        isActive: true,
      },
      {
        category: 'accessories',
        name: { en: 'ClawBox USB-C Hub', zh: 'ClawBox USB-C 扩展坞' },
        description: { en: '7-in-1 USB-C hub for ClawBox', zh: 'ClawBox 7合1 USB-C 扩展坞' },
        specs: { ports: '3xUSB-A, 1xHDMI, 1xEthernet, 1xSD, 1xUSB-C PD' },
        preinstalledSoftware: null,
        tokenHubBonusAmount: null,
        price: 49,
        stockByRegion: { apac: 500, na: 300, eu: 200 },
        isActive: true,
      },
    ];

    for (const p of defaults) {
      const product: HardwareProduct = { id: crypto.randomUUID(), ...p, createdAt: new Date() };
      this.products.set(product.id, product);
    }
  }

  // ─── Product Listing (Req 16.1, 16.2) ───

  listProducts(dto: ListProductsDto): HardwareProduct[] {
    let products = Array.from(this.products.values()).filter((p) => p.isActive);

    if (dto.category) {
      const validCategories: HardwareCategory[] = [
        'clawbox_lite', 'clawbox_pro', 'clawbox_enterprise',
        'recommended_hardware', 'accessories',
      ];
      if (!validCategories.includes(dto.category)) {
        throw new BadRequestException(`Invalid category: ${dto.category}`);
      }
      products = products.filter((p) => p.category === dto.category);
    }

    if (dto.region) {
      products = products.filter((p) => {
        const stock = p.stockByRegion[dto.region!];
        return stock !== undefined && stock > 0;
      });
    }

    return products;
  }

  // ─── Product Detail (Req 16.3) ───

  getProductDetail(dto: GetProductDetailDto): ProductDetail {
    if (!dto.productId) throw new BadRequestException('productId is required');

    const product = this.products.get(dto.productId);
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);

    const isClawBox = CLAWBOX_CATEGORIES.includes(product.category);

    return {
      ...product,
      warrantyMonths: isClawBox ? 12 : 6,
      setupGuideUrl: isClawBox ? `https://docs.openclaw.club/clawbox/${product.category}/setup` : null,
    };
  }

  // ─── Create Hardware Order (Req 16.3, 16.5, 16.7) ───

  createHardwareOrder(dto: CreateHardwareOrderDto): HardwareOrder {
    if (!dto.userId) throw new BadRequestException('userId is required');
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const orderItems: HardwareOrderItem[] = [];
    let subtotal = 0;
    let hasBundleInstallation = false;
    const clawBoxItemsForTokenHub: HardwareProduct[] = [];

    for (const item of dto.items) {
      if (!item.productId) throw new BadRequestException('productId is required for each item');
      if (!item.quantity || item.quantity < 1) {
        throw new BadRequestException('quantity must be at least 1');
      }

      const product = this.products.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      if (!product.isActive) throw new BadRequestException(`Product ${item.productId} is not available`);

      // Check stock for region
      if (dto.region) {
        const stock = product.stockByRegion[dto.region];
        if (stock === undefined || stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name.en} in region ${dto.region}`,
          );
        }
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      const includeInstallation = item.includeInstallation ?? false;
      if (includeInstallation) hasBundleInstallation = true;

      // Track ClawBox items for Token_Hub account creation (Req 16.5)
      if (CLAWBOX_CATEGORIES.includes(product.category)) {
        for (let i = 0; i < item.quantity; i++) {
          clawBoxItemsForTokenHub.push(product);
        }
      }

      orderItems.push({
        productId: product.id,
        productName: product.name.en || Object.values(product.name)[0],
        quantity: item.quantity,
        unitPrice: product.price,
        includeInstallation,
        lineTotal,
      });
    }

    // Bundle discount: hardware + installation (Req 16.7)
    let bundleDiscount = 0;
    if (hasBundleInstallation) {
      bundleDiscount = parseFloat(((subtotal * BUNDLE_DISCOUNT_PERCENT) / 100).toFixed(2));
    }

    const totalAmount = parseFloat((subtotal - bundleDiscount).toFixed(2));

    // Auto-create Token_Hub accounts for ClawBox purchases (Req 16.5)
    const tokenHubAccountsCreated: TokenHubAccount[] = [];
    for (const product of clawBoxItemsForTokenHub) {
      const account: TokenHubAccount = {
        id: crypto.randomUUID(),
        userId: dto.userId,
        bonusAmount: product.tokenHubBonusAmount ?? 0,
        createdAt: new Date(),
      };
      this.tokenHubAccounts.set(account.id, account);
      tokenHubAccountsCreated.push(account);
    }

    // Deduct stock
    if (dto.region) {
      for (const item of dto.items) {
        const product = this.products.get(item.productId)!;
        product.stockByRegion[dto.region] -= item.quantity;
      }
    }

    const order: HardwareOrder = {
      id: crypto.randomUUID(),
      orderNumber: `HW-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      userId: dto.userId,
      items: orderItems,
      subtotal,
      bundleDiscount,
      totalAmount,
      currency: 'USD',
      region: dto.region ?? null,
      status: 'pending_payment',
      tokenHubAccountsCreated,
      createdAt: new Date(),
    };

    this.orders.set(order.id, order);
    return order;
  }

  // ─── Shipping Status (Req 16.8, 16.9) ───

  getShippingStatus(dto: GetShippingStatusDto): ShippingStatus {
    if (!dto.orderId) throw new BadRequestException('orderId is required');

    const order = this.orders.get(dto.orderId);
    if (!order) throw new NotFoundException(`Order ${dto.orderId} not found`);

    // Return existing shipping status if tracked
    const existing = this.shippingStatuses.get(dto.orderId);
    if (existing) return existing;

    // Generate initial shipping status based on order region
    const region = order.region ?? 'na';
    const config = REGIONAL_SHIPPING.find((r) => r.region === region) ?? REGIONAL_SHIPPING[1]; // default NA

    const stage: ShippingStage = this.mapOrderStatusToShippingStage(order.status);

    const status: ShippingStatus = {
      orderId: order.id,
      stage,
      carrier: {
        name: config.carrier,
        trackingNumber: stage === 'pending' ? null : `TRK-${order.orderNumber}`,
        trackingUrl: stage === 'pending' ? null : `https://track.${config.carrier.toLowerCase().replace(/\s/g, '')}.com/TRK-${order.orderNumber}`,
      },
      estimatedDeliveryDays: config.estimatedDays,
      shippedAt: stage === 'pending' || stage === 'processing' ? null : new Date(),
      deliveredAt: stage === 'delivered' ? new Date() : null,
      region,
      updatedAt: new Date(),
    };

    this.shippingStatuses.set(dto.orderId, status);
    return status;
  }

  private mapOrderStatusToShippingStage(orderStatus: HardwareOrderStatus): ShippingStage {
    switch (orderStatus) {
      case 'pending_payment': return 'pending';
      case 'paid': return 'pending';
      case 'processing': return 'processing';
      case 'shipped': return 'in_transit';
      case 'delivered': return 'delivered';
      case 'cancelled': return 'pending';
      default: return 'pending';
    }
  }

  // ─── After-Sales Service (Req 16.10) ───

  requestAfterSales(dto: RequestAfterSalesDto): AfterSalesTicket {
    if (!dto.orderId) throw new BadRequestException('orderId is required');
    if (!dto.type) throw new BadRequestException('after-sales type is required');

    const validTypes: AfterSalesType[] = ['return', 'exchange', 'warranty_repair', 'tech_support'];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException(`Invalid after-sales type: ${dto.type}`);
    }

    const order = this.orders.get(dto.orderId);
    if (!order) throw new NotFoundException(`Order ${dto.orderId} not found`);

    // Check warranty for warranty_repair
    const isWithinWarranty = this.isOrderWithinWarranty(order);

    if (dto.type === 'warranty_repair' && !isWithinWarranty) {
      throw new BadRequestException('Warranty period has expired for this order');
    }

    // Returns/exchanges only allowed within 30 days
    if ((dto.type === 'return' || dto.type === 'exchange') && !this.isWithinReturnWindow(order)) {
      throw new BadRequestException('Return/exchange window (30 days) has expired');
    }

    const ticket: AfterSalesTicket = {
      id: crypto.randomUUID(),
      orderId: order.id,
      type: dto.type,
      status: 'open' as AfterSalesStatus,
      reason: dto.reason ?? '',
      isWithinWarranty,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.afterSalesTickets.set(ticket.id, ticket);
    return ticket;
  }

  private isOrderWithinWarranty(order: HardwareOrder): boolean {
    const hasClawBox = order.items.some((item) => {
      const product = this.products.get(item.productId);
      return product && CLAWBOX_CATEGORIES.includes(product.category);
    });

    const warrantyMonths = hasClawBox ? CLAWBOX_WARRANTY_MONTHS : 6;
    const warrantyEnd = new Date(order.createdAt);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths);

    return new Date() <= warrantyEnd;
  }

  private isWithinReturnWindow(order: HardwareOrder): boolean {
    const returnDeadline = new Date(order.createdAt);
    returnDeadline.setDate(returnDeadline.getDate() + 30);
    return new Date() <= returnDeadline;
  }

  // ─── Helpers for testing ───

  getOrder(orderId: string): HardwareOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    return order;
  }

  getTokenHubAccount(accountId: string): TokenHubAccount {
    const account = this.tokenHubAccounts.get(accountId);
    if (!account) throw new NotFoundException(`Token_Hub account ${accountId} not found`);
    return account;
  }

  getProductIds(): string[] {
    return Array.from(this.products.keys());
  }

  getProductByCategory(category: HardwareCategory): HardwareProduct | undefined {
    return Array.from(this.products.values()).find((p) => p.category === category);
  }

  getAfterSalesTicket(ticketId: string): AfterSalesTicket {
    const ticket = this.afterSalesTickets.get(ticketId);
    if (!ticket) throw new NotFoundException(`After-sales ticket ${ticketId} not found`);
    return ticket;
  }

  /** Update order status (for testing shipping flow) */
  updateOrderStatus(orderId: string, status: HardwareOrderStatus): HardwareOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    order.status = status;
    // Clear cached shipping status so it regenerates
    this.shippingStatuses.delete(orderId);
    return order;
  }
}
