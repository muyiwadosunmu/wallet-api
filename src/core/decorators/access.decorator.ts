import { applyDecorators, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guard/gql-auth.guard';

export const GqlProtected = () => {
  return applyDecorators(UseGuards(GqlAuthGuard));
};
