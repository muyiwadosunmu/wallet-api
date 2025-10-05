import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { WalletService } from './wallets.service';
import { WebhookSource } from './enums/enums';
import {
  RequestIPAndUserAgent,
  IRequestIPAndUserAgent,
} from 'src/core/decorators/logged-in-decorator';

@Controller('v1/wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  @HttpCode(HttpStatus.OK) // Always return 200 OK to Alchemy
  @Post('webhook')
  async handleAlchemyWalletsWebhook(
    @Req() req: RawBodyRequest<Request>,
    @RequestIPAndUserAgent() ipAndUserAgent: IRequestIPAndUserAgent,
    @Headers('x-alchemy-signature') signature: string,
  ) {
    try {
      // Get the raw body as a string
      const rawBody = req.rawBody;
      console.log('Raw body:', req.rawBody);
      console.log('Parsed body:', req.body);
      console.log('Signature:', signature);

      // if (!rawBody) {
      //   this.logger.warn('No raw body found in webhook request');
      //   return { success: false, message: 'Invalid request' };
      // }

      // Verify signature with the raw body string
      const isValid = await this.walletService.verifyWebhookSignature(
        rawBody.toString(),
        signature,
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        return { success: false, message: 'Invalid signature' };
      }

      // Parse the body for processing
      const payload = JSON.parse(rawBody.toString('utf-8'));

      this.logger.log(`Received valid webhook: ${JSON.stringify(payload)}`);

      await this.walletService.webhookModel.create({
        source: WebhookSource.Alchemy,
        event: payload?.event,
        ip: ipAndUserAgent.ip,
        userAgent: ipAndUserAgent.userAgent,
        data: payload,
      });

      // Process the webhook
      await this.walletService.processWebhookEvent(payload);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling webhook: ${error.message}`);
      return { success: false, message: 'Error processing webhook' };
    }
  }
}
