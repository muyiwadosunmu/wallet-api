import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { AuthModule } from '../auth/auth.module';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  imports: [CoreModule, AuthModule],
})
export class UsersModule {}
