import { Module } from '@nestjs/common';
import { WalletService } from './wallets.service';
import { WalletsResolver } from './wallets.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoDBSchema } from 'src/core/database/MongooseDBSchema';
import { AlchemyProvider } from 'src/core/services/alchemy/alchemy.provider';
import { EtherscanProvider } from 'src/core/services/etherscan/etherscan.provider';
import { CoreModule } from 'src/core/core.module';
import { AuthModule } from '../auth/auth.module';
import { WalletController } from './wallet.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    MongooseModule.forFeature(MongoDBSchema),
    HttpModule,
  ],
  controllers: [WalletController],
  providers: [
    WalletsResolver,
    WalletService,
    {
      provide: 'BlockchainProvider',
      useClass: AlchemyProvider,
    },
    EtherscanProvider,
  ],
  exports: [WalletService],
})
export class WalletsModule {}
