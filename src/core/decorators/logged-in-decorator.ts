/* eslint-disable @typescript-eslint/no-unused-vars */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from 'src/modules/v1/users/schema/user.schema';

// Admin decorator
export const LoggedInUser = createParamDecorator(
  async (data = '', ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user: UserDocument = request.user;

    return user;
  },
);
