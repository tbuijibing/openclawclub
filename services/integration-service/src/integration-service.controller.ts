import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Patch,
} from '@nestjs/common';
import { IntegrationService } from './integration.service';
import {
  ConnectToolDto,
  ConfigurePrivateModelDto,
  UpdatePrivateModelDto,
} from './dto/integration.dto';

@Controller('integrations')
export class IntegrationServiceController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'integration-service' };
  }

  /* ── OAuth Connection (Req 7.1, 7.2) ── */

  @Post('connect')
  connectTool(@Body() dto: ConnectToolDto) {
    return this.integrationService.connectTool(dto);
  }

  @Delete(':id')
  disconnectTool(@Param('id') toolId: string, @Query('userId') userId: string) {
    return this.integrationService.disconnectTool({ userId, toolId });
  }

  /* ── Integration Status (Req 7.3) ── */

  @Get('status')
  getIntegrationStatus(@Query('userId') userId: string) {
    return this.integrationService.getIntegrationStatus({ userId });
  }

  /* ── Connection Validation (Req 7.3, 7.4) ── */

  @Post(':id/validate')
  validateConnection(@Param('id') integrationId: string) {
    return this.integrationService.validateConnection({ integrationId });
  }

  /* ── Error Guide (Req 7.4) ── */

  @Get('errors/:errorCode')
  getErrorGuide(@Param('errorCode') errorCode: string) {
    return this.integrationService.getErrorGuide(errorCode);
  }

  /* ── Private Model Configuration (Req 7.5) ── */

  @Post('private-models')
  configurePrivateModel(@Body() dto: ConfigurePrivateModelDto) {
    return this.integrationService.configurePrivateModel(dto);
  }

  @Patch('private-models/:id')
  updatePrivateModel(
    @Param('id') modelId: string,
    @Body() body: Omit<UpdatePrivateModelDto, 'modelId'>,
  ) {
    return this.integrationService.updatePrivateModel({ modelId, ...body });
  }

  @Get('private-models')
  getPrivateModels(@Query('enterpriseUserId') enterpriseUserId: string) {
    return this.integrationService.getPrivateModels({ enterpriseUserId });
  }

  /* ── API Documentation (Req 7.6) ── */

  @Get('api-docs')
  getApiDocumentation() {
    return this.integrationService.getApiDocumentation();
  }
}
