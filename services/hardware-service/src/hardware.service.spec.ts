import { HardwareService } from './hardware.service';
import {
  CLAWBOX_CATEGORIES,
  BUNDLE_DISCOUNT_PERCENT,
  DEFAULT_TOKEN_HUB_BONUS,
  REGIONAL_SHIPPING,
  CLAWBOX_WARRANTY_MONTHS,
} from '@openclaw-club/shared';

describe('HardwareService', () => {
  let service: HardwareService;

  beforeEach(() => {
    service = new HardwareService();
  });

  // ─── Product Listing (Req 16.1, 16.2) ───

  describe('listProducts', () => {
    it('should return all active products when no filters', () => {
      const products = service.listProducts({});
      expect(products.length).toBeGreaterThanOrEqual(5);
      expect(products.every((p) => p.isActive)).toBe(true);
    });

    it('should filter by clawbox_lite category', () => {
      const products = service.listProducts({ category: 'clawbox_lite' });
      expect(products.length).toBe(1);
      expect(products[0].category).toBe('clawbox_lite');
    });

    it('should filter by clawbox_pro category', () => {
      const products = service.listProducts({ category: 'clawbox_pro' });
      expect(products.length).toBe(1);
      expect(products[0].category).toBe('clawbox_pro');
    });

    it('should filter by clawbox_enterprise category', () => {
      const products = service.listProducts({ category: 'clawbox_enterprise' });
      expect(products.length).toBe(1);
      expect(products[0].category).toBe('clawbox_enterprise');
    });

    it('should filter by recommended_hardware category', () => {
      const products = service.listProducts({ category: 'recommended_hardware' });
      expect(products.length).toBe(1);
      expect(products[0].name.en).toContain('Mac Mini');
    });

    it('should filter by accessories category', () => {
      const products = service.listProducts({ category: 'accessories' });
      expect(products.length).toBe(1);
    });

    it('should filter by region with stock', () => {
      const products = service.listProducts({ region: 'apac' });
      expect(products.length).toBeGreaterThan(0);
      products.forEach((p) => {
        expect(p.stockByRegion['apac']).toBeGreaterThan(0);
      });
    });

    it('should filter by both category and region', () => {
      const products = service.listProducts({ category: 'clawbox_lite', region: 'na' });
      expect(products.length).toBe(1);
      expect(products[0].category).toBe('clawbox_lite');
    });

    it('should throw for invalid category', () => {
      expect(() => service.listProducts({ category: 'invalid' as any })).toThrow(/Invalid category/);
    });
  });

  // ─── Product Detail (Req 16.3) ───

  describe('getProductDetail', () => {
    it('should return ClawBox product with warranty, setup guide, specs, preinstalled software, and token bonus', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const detail = service.getProductDetail({ productId: lite.id });

      expect(detail.id).toBe(lite.id);
      expect(detail.specs).toBeDefined();
      expect(detail.preinstalledSoftware).toBeInstanceOf(Array);
      expect(detail.preinstalledSoftware!.length).toBeGreaterThan(0);
      expect(detail.tokenHubBonusAmount).toBe(DEFAULT_TOKEN_HUB_BONUS.clawbox_lite);
      expect(detail.warrantyMonths).toBe(12);
      expect(detail.setupGuideUrl).toContain('clawbox_lite');
    });

    it('should return non-ClawBox product with shorter warranty and no setup guide', () => {
      const recommended = service.getProductByCategory('recommended_hardware')!;
      const detail = service.getProductDetail({ productId: recommended.id });

      expect(detail.warrantyMonths).toBe(6);
      expect(detail.setupGuideUrl).toBeNull();
      expect(detail.preinstalledSoftware).toBeNull();
      expect(detail.tokenHubBonusAmount).toBeNull();
    });

    it('should throw for empty productId', () => {
      expect(() => service.getProductDetail({ productId: '' })).toThrow(/productId is required/);
    });

    it('should throw for non-existent product', () => {
      expect(() => service.getProductDetail({ productId: 'non-existent' })).toThrow(/not found/);
    });
  });

  // ─── Create Hardware Order (Req 16.3, 16.5, 16.7) ───

  describe('createHardwareOrder', () => {
    it('should create a basic hardware order', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      expect(order.id).toBeDefined();
      expect(order.orderNumber).toMatch(/^HW-/);
      expect(order.userId).toBe('user-1');
      expect(order.items).toHaveLength(1);
      expect(order.subtotal).toBe(lite.price);
      expect(order.bundleDiscount).toBe(0);
      expect(order.totalAmount).toBe(lite.price);
      expect(order.status).toBe('pending_payment');
      expect(order.createdAt).toBeInstanceOf(Date);
    });

    it('should create order with multiple items', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const accessory = service.getProductByCategory('accessories')!;

      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [
          { productId: lite.id, quantity: 1 },
          { productId: accessory.id, quantity: 2 },
        ],
      });

      expect(order.items).toHaveLength(2);
      expect(order.subtotal).toBe(lite.price + accessory.price * 2);
      expect(order.totalAmount).toBe(order.subtotal);
    });

    it('should apply bundle discount when includeInstallation is true (Req 16.7)', () => {
      const pro = service.getProductByCategory('clawbox_pro')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: pro.id, quantity: 1, includeInstallation: true }],
      });

      const expectedDiscount = parseFloat(((pro.price * BUNDLE_DISCOUNT_PERCENT) / 100).toFixed(2));
      expect(order.bundleDiscount).toBe(expectedDiscount);
      expect(order.totalAmount).toBe(parseFloat((pro.price - expectedDiscount).toFixed(2)));
    });

    it('should auto-create Token_Hub account for ClawBox purchase (Req 16.5)', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      expect(order.tokenHubAccountsCreated).toHaveLength(1);
      expect(order.tokenHubAccountsCreated[0].userId).toBe('user-1');
      expect(order.tokenHubAccountsCreated[0].bonusAmount).toBe(DEFAULT_TOKEN_HUB_BONUS.clawbox_lite);
    });

    it('should create multiple Token_Hub accounts for multiple ClawBox units', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 3 }],
      });

      expect(order.tokenHubAccountsCreated).toHaveLength(3);
      order.tokenHubAccountsCreated.forEach((acc) => {
        expect(acc.bonusAmount).toBe(DEFAULT_TOKEN_HUB_BONUS.clawbox_lite);
      });
    });

    it('should NOT create Token_Hub account for non-ClawBox products', () => {
      const recommended = service.getProductByCategory('recommended_hardware')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: recommended.id, quantity: 1 }],
      });

      expect(order.tokenHubAccountsCreated).toHaveLength(0);
    });

    it('should deduct stock when region is specified', () => {
      const accessory = service.getProductByCategory('accessories')!;
      const initialStock = accessory.stockByRegion['apac'];

      service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: accessory.id, quantity: 2 }],
        region: 'apac',
      });

      expect(accessory.stockByRegion['apac']).toBe(initialStock - 2);
    });

    it('should throw for insufficient stock', () => {
      const enterprise = service.getProductByCategory('clawbox_enterprise')!;
      expect(() =>
        service.createHardwareOrder({
          userId: 'user-1',
          items: [{ productId: enterprise.id, quantity: 9999 }],
          region: 'eu',
        }),
      ).toThrow(/Insufficient stock/);
    });

    it('should throw for empty userId', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      expect(() =>
        service.createHardwareOrder({
          userId: '',
          items: [{ productId: lite.id, quantity: 1 }],
        }),
      ).toThrow(/userId is required/);
    });

    it('should throw for empty items', () => {
      expect(() =>
        service.createHardwareOrder({ userId: 'user-1', items: [] }),
      ).toThrow(/At least one item/);
    });

    it('should throw for invalid quantity', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      expect(() =>
        service.createHardwareOrder({
          userId: 'user-1',
          items: [{ productId: lite.id, quantity: 0 }],
        }),
      ).toThrow(/quantity must be at least 1/);
    });

    it('should throw for non-existent product in items', () => {
      expect(() =>
        service.createHardwareOrder({
          userId: 'user-1',
          items: [{ productId: 'non-existent', quantity: 1 }],
        }),
      ).toThrow(/not found/);
    });
  });

  // ─── Helper methods ───

  describe('getOrder', () => {
    it('should retrieve a created order', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const created = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      const retrieved = service.getOrder(created.id);
      expect(retrieved.id).toBe(created.id);
    });

    it('should throw for non-existent order', () => {
      expect(() => service.getOrder('non-existent')).toThrow(/not found/);
    });
  });

  // ─── Shipping Status (Req 16.8, 16.9) ───

  describe('getShippingStatus', () => {
    it('should return shipping status for an order with region-matched carrier', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
        region: 'apac',
      });

      const status = service.getShippingStatus({ orderId: order.id });

      expect(status.orderId).toBe(order.id);
      expect(status.region).toBe('apac');
      expect(status.carrier.name).toBe('SF Express');
      expect(status.estimatedDeliveryDays).toBe(5);
      expect(status.updatedAt).toBeInstanceOf(Date);
    });

    it('should match NA carrier for NA region', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
        region: 'na',
      });

      const status = service.getShippingStatus({ orderId: order.id });
      expect(status.carrier.name).toBe('FedEx');
      expect(status.estimatedDeliveryDays).toBe(3);
    });

    it('should match EU carrier for EU region', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
        region: 'eu',
      });

      const status = service.getShippingStatus({ orderId: order.id });
      expect(status.carrier.name).toBe('DHL');
      expect(status.estimatedDeliveryDays).toBe(4);
    });

    it('should default to NA when order has no region', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      const status = service.getShippingStatus({ orderId: order.id });
      expect(status.region).toBe('na');
      expect(status.carrier.name).toBe('FedEx');
    });

    it('should show pending stage for pending_payment order', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
        region: 'na',
      });

      const status = service.getShippingStatus({ orderId: order.id });
      expect(status.stage).toBe('pending');
      expect(status.carrier.trackingNumber).toBeNull();
      expect(status.shippedAt).toBeNull();
      expect(status.deliveredAt).toBeNull();
    });

    it('should show in_transit stage for shipped order', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
        region: 'na',
      });

      service.updateOrderStatus(order.id, 'shipped');
      const status = service.getShippingStatus({ orderId: order.id });

      expect(status.stage).toBe('in_transit');
      expect(status.carrier.trackingNumber).toBeTruthy();
      expect(status.carrier.trackingUrl).toBeTruthy();
      expect(status.shippedAt).toBeInstanceOf(Date);
    });

    it('should show delivered stage for delivered order', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
        region: 'eu',
      });

      service.updateOrderStatus(order.id, 'delivered');
      const status = service.getShippingStatus({ orderId: order.id });

      expect(status.stage).toBe('delivered');
      expect(status.deliveredAt).toBeInstanceOf(Date);
    });

    it('should throw for empty orderId', () => {
      expect(() => service.getShippingStatus({ orderId: '' })).toThrow(/orderId is required/);
    });

    it('should throw for non-existent order', () => {
      expect(() => service.getShippingStatus({ orderId: 'non-existent' })).toThrow(/not found/);
    });
  });

  // ─── After-Sales Service (Req 16.10) ───

  describe('requestAfterSales', () => {
    it('should create a return ticket for a recent order', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      const ticket = service.requestAfterSales({
        orderId: order.id,
        type: 'return',
        reason: 'Changed my mind',
      });

      expect(ticket.id).toBeDefined();
      expect(ticket.orderId).toBe(order.id);
      expect(ticket.type).toBe('return');
      expect(ticket.status).toBe('open');
      expect(ticket.reason).toBe('Changed my mind');
      expect(ticket.isWithinWarranty).toBe(true);
      expect(ticket.createdAt).toBeInstanceOf(Date);
    });

    it('should create an exchange ticket', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      const ticket = service.requestAfterSales({
        orderId: order.id,
        type: 'exchange',
      });

      expect(ticket.type).toBe('exchange');
      expect(ticket.status).toBe('open');
    });

    it('should create a warranty_repair ticket for ClawBox within 12 months', () => {
      const pro = service.getProductByCategory('clawbox_pro')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: pro.id, quantity: 1 }],
      });

      const ticket = service.requestAfterSales({
        orderId: order.id,
        type: 'warranty_repair',
        reason: 'Fan noise issue',
      });

      expect(ticket.type).toBe('warranty_repair');
      expect(ticket.isWithinWarranty).toBe(true);
      expect(ticket.reason).toBe('Fan noise issue');
    });

    it('should create a tech_support ticket', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      const ticket = service.requestAfterSales({
        orderId: order.id,
        type: 'tech_support',
        reason: 'Need help with setup',
      });

      expect(ticket.type).toBe('tech_support');
      expect(ticket.status).toBe('open');
    });

    it('should default reason to empty string when not provided', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      const ticket = service.requestAfterSales({
        orderId: order.id,
        type: 'tech_support',
      });

      expect(ticket.reason).toBe('');
    });

    it('should throw for empty orderId', () => {
      expect(() =>
        service.requestAfterSales({ orderId: '', type: 'return' }),
      ).toThrow(/orderId is required/);
    });

    it('should throw for non-existent order', () => {
      expect(() =>
        service.requestAfterSales({ orderId: 'non-existent', type: 'return' }),
      ).toThrow(/not found/);
    });

    it('should throw for invalid after-sales type', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      expect(() =>
        service.requestAfterSales({ orderId: order.id, type: 'invalid' as any }),
      ).toThrow(/Invalid after-sales type/);
    });

    it('should throw for empty type', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      expect(() =>
        service.requestAfterSales({ orderId: order.id, type: '' as any }),
      ).toThrow(/after-sales type is required/);
    });

    it('should retrieve after-sales ticket by id', () => {
      const lite = service.getProductByCategory('clawbox_lite')!;
      const order = service.createHardwareOrder({
        userId: 'user-1',
        items: [{ productId: lite.id, quantity: 1 }],
      });

      const ticket = service.requestAfterSales({
        orderId: order.id,
        type: 'tech_support',
      });

      const retrieved = service.getAfterSalesTicket(ticket.id);
      expect(retrieved.id).toBe(ticket.id);
    });
  });

});
