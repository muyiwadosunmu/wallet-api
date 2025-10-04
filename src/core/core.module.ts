import { Module } from '@nestjs/common';
import { VerificationSecurity } from './security/verification.security';
import { JwtService } from '@nestjs/jwt';
import { AlchemyProvider } from './services/alchemy/alchemy.provider';

@Module({
  providers: [VerificationSecurity, JwtService, AlchemyProvider],
  exports: [VerificationSecurity, JwtService, AlchemyProvider],
})
export class CoreModule {}
