import { Module } from '@nestjs/common';
import { WalletService } from './wallets.service';
import { WalletsResolver } from './wallets.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoDBSchema } from 'src/core/database/MongooseDBSchema';
import { AlchemyProvider } from 'src/core/services/alchemy/alchemy.provider';
import { CoreModule } from 'src/core/core.module';
import { AuthModule } from '../auth/auth.module';
import { WalletController } from './wallet.controller';

@Module({
  imports: [CoreModule, AuthModule, MongooseModule.forFeature(MongoDBSchema)],
  controllers: [WalletController],
  providers: [
    WalletsResolver,
    WalletService,
    {
      provide: 'BlockchainProvider',
      useClass: AlchemyProvider,
    },
  ],
  exports: [WalletService],
})
export class WalletsModule {}
