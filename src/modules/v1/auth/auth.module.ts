import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoDBSchema } from 'src/core/database/MongooseDBSchema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VerificationSecurity } from 'src/core/security/verification.security';
import { WebEmail } from 'src/core/email/webEmail';

@Module({
  controllers: [AuthController],
  providers: [AuthService, VerificationSecurity, WebEmail],
  imports: [MongooseModule.forFeature(MongoDBSchema), JwtModule],
  exports: [AuthService],
})
export class AuthModule {}
