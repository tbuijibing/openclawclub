import { Controller, Post, Body, Headers, BadRequestException, RawBodyRequest, Req } from '@nestjs/common';
import { Public } from './decorators/public.decorator';
import { UserService } from './user.service';
import { LogtoService } from './logto/logto.service';
import { LogtoWebhookPayload } from './dto/webhook.dto';

@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly userService: UserService,
    private readonly logtoService: LogtoService,
  ) {}

  /** Handle Logto webhook callbacks (user registration, etc.) */
  @Public()
  @Post('logto')
  async handleLogtoWebhook(
    @Body() payload: LogtoWebhookPayload,
    @Headers('logto-signature-sha-256') signature: string,
  ) {
    // Verify webhook signature if configured
    if (signature) {
      const isValid = this.logtoService.verifyWebhookSignature(
        JSON.stringify(payload),
        signature,
      );
      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const user = await this.userService.handleWebhook(payload);
    return { received: true, userId: user?.id };
  }
}
