import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { HardwareService } from './hardware.service';
import type { HardwareCategory, HardwareRegion, AfterSalesType } from '@openclaw-club/shared';
import { CreateHardwareOrderDto, RequestAfterSalesDto } from './dto/hardware.dto';

@Controller('hardware')
export class HardwareServiceController {
  constructor(private readonly hardwareService: HardwareService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'hardware-service' };
  }

  /* ── Product Listing (Req 16.1, 16.2) ── */

  @Get('products')
  listProducts(
    @Query('category') category?: HardwareCategory,
    @Query('region') region?: HardwareRegion,
  ) {
    return this.hardwareService.listProducts({ category, region });
  }

  /* ── Product Detail (Req 16.3) ── */

  @Get('products/:id')
  getProductDetail(@Param('id') productId: string) {
    return this.hardwareService.getProductDetail({ productId });
  }

  /* ── Create Hardware Order (Req 16.3, 16.5, 16.7) ── */

  @Post('orders')
  createHardwareOrder(@Body() dto: CreateHardwareOrderDto) {
    return this.hardwareService.createHardwareOrder(dto);
  }

  /* ── Get Order ── */

  @Get('orders/:id')
  getOrder(@Param('id') orderId: string) {
    return this.hardwareService.getOrder(orderId);
  }

  /* ── Shipping Status (Req 16.8, 16.9) ── */

  @Get('orders/:id/shipping')
  getShippingStatus(@Param('id') orderId: string) {
    return this.hardwareService.getShippingStatus({ orderId });
  }

  /* ── After-Sales Service (Req 16.10) ── */

  @Post('orders/:id/after-sales')
  requestAfterSales(
    @Param('id') orderId: string,
    @Body() body: { type: AfterSalesType; reason?: string },
  ) {
    return this.hardwareService.requestAfterSales({
      orderId,
      type: body.type,
      reason: body.reason,
    });
  }
}
