import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from 'src/core/core.module';
import { MongoDBSchema } from 'src/core/database/MongooseDBSchema';

import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { UserResolver } from './users/users.resolver';
import { AuthResolver } from './auth/auth.resolver';

@Module({
  imports: [
    CoreModule,
    UsersModule,
    AuthModule,
    MongooseModule.forFeature(MongoDBSchema),
    JwtModule,
    WalletsModule,
  ],
  providers: [],
})
export class V1Module {}
