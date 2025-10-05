import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('v1/health-check')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  healthCheck() {
    return this.appService.healthCheck();
  }
}
