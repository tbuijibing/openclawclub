import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PartnerService } from './partner.service';
import {
  ApplyPartnerDto,
  ReviewApplicationDto,
  RecordEarningDto,
  SettleMonthlyEarningsDto,
  GetDashboardDto,
  RegisterExternalVendorDto,
  UpdateVendorProfileDto,
  DistributeOrderDto,
  ConvertVendorDto,
} from './dto/partner.dto';

@Controller('partners')
export class PartnerServiceController {
  constructor(private readonly partnerService: PartnerService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'partner-service' };
  }

  /* ── Applications (Req 10.1, 10.2) ── */

  @Post('applications')
  applyPartner(@Body() dto: ApplyPartnerDto) {
    return this.partnerService.applyPartner(dto);
  }

  @Get('applications/:id')
  getApplication(@Param('id') id: string) {
    return this.partnerService.getApplication(id);
  }

  @Get('applications')
  listApplications(@Query('userId') userId: string) {
    return this.partnerService.listApplicationsByUser(userId);
  }

  @Post('applications/:id/review')
  reviewApplication(@Param('id') id: string, @Body() body: Omit<ReviewApplicationDto, 'applicationId'>) {
    return this.partnerService.reviewApplication({ applicationId: id, ...body });
  }

  /* ── Earnings & Settlement (Req 10.3-10.6) ── */

  @Post('earnings')
  recordEarning(@Body() dto: RecordEarningDto) {
    return this.partnerService.calculateAndRecordEarning(dto);
  }

  @Post('earnings/settle')
  settleMonthly(@Body() dto: SettleMonthlyEarningsDto) {
    return this.partnerService.settleMonthlyEarnings(dto);
  }

  /* ── Dashboard (Req 10.7) ── */

  @Get('dashboard/:partnerId')
  getDashboard(@Param('partnerId') partnerId: string) {
    return this.partnerService.getEarningsDashboard({ partnerId });
  }

  /* ── External Vendors (Req 10.8, 10.9, 10.10) ── */

  @Post('vendors')
  registerVendor(@Body() dto: RegisterExternalVendorDto) {
    return this.partnerService.registerExternalVendor(dto);
  }

  @Get('vendors')
  listVendors() {
    return this.partnerService.listVendors();
  }

  @Get('vendors/:id')
  getVendor(@Param('id') id: string) {
    return this.partnerService.getVendor(id);
  }

  @Patch('vendors/:id')
  updateVendor(@Param('id') id: string, @Body() body: Omit<UpdateVendorProfileDto, 'vendorId'>) {
    return this.partnerService.updateVendorProfile({ vendorId: id, ...body });
  }

  /* ── Order Distribution (Req 10.8, 10.9) ── */

  @Post('vendors/:id/distribute')
  distributeOrder(@Param('id') vendorId: string, @Body() body: Omit<DistributeOrderDto, 'vendorId'>) {
    return this.partnerService.distributeOrder({ vendorId, ...body });
  }

  /* ── Vendor Conversion (Req 10.11) ── */

  @Post('vendors/:id/convert')
  convertVendor(@Param('id') vendorId: string) {
    return this.partnerService.convertToCertifiedEngineer({ vendorId });
  }
}
