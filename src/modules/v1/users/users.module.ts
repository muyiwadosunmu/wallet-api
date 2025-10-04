import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from 'src/core/core.module';

@Module({
  providers: [UsersService],
  imports: [CoreModule, AuthModule],
})
export class UsersModule {}
