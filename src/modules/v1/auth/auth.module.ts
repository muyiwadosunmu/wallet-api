import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoDBSchema } from 'src/core/database/MongooseDBSchema';
import { WebEmail } from 'src/core/email/webEmail';
import { VerificationSecurity } from 'src/core/security/verification.security';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

@Module({
  providers: [AuthService, AuthResolver, VerificationSecurity, WebEmail],
  imports: [MongooseModule.forFeature(MongoDBSchema), JwtModule],
  exports: [AuthService, VerificationSecurity, WebEmail],
})
export class AuthModule {}
