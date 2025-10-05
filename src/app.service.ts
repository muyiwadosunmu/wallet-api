import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck(): string {
    return `{
  "status": "ok",
  "timestamp": "${new Date().toISOString()}"
}`;
  }
}
