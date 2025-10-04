import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../core/guard/auth.guard';
import { GqlAuthGuard } from '../guard/gql-auth.guard';

export function Protected() {
  return applyDecorators(UseGuards(AuthGuard));
}

export const GqlProtected = () => {
  return applyDecorators(UseGuards(GqlAuthGuard));
};
