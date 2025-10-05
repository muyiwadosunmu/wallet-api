import { Module } from '@nestjs/common';
import { VerificationSecurity } from './security/verification.security';
import { JwtService } from '@nestjs/jwt';
import { AlchemyProvider } from './services/alchemy/alchemy.provider';
import { EtherscanProvider } from './services/etherscan/etherscan.provider';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [
    VerificationSecurity,
    JwtService,
    AlchemyProvider,
    EtherscanProvider,
  ],
  exports: [
    VerificationSecurity,
    JwtService,
    AlchemyProvider,
    EtherscanProvider,
  ],
})
export class CoreModule {}
