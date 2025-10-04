/* eslint-disable @typescript-eslint/no-unused-vars */
import { UserDocument } from 'src/modules/v1/users/schema/user.schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// Admin decorator
export const LoggedInUser = createParamDecorator(
  async (data = '', ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user: UserDocument = request.user;

    return user;
  },
);

export const LoggedInGqlUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().user;
  },
);

export const RequestIPAndUserAgent = createParamDecorator(
  async (data = '', ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // if x-forwarded is array take first element
    const xForwardedIp = Array.isArray(request.headers['x-forwarded-for'])
      ? request.headers['x-forwarded-for'][0]
      : request.headers['x-forwarded-for'];

    // split ip eg 8.8.8.8 to 88
    const reqIP = request.ip;

    // IP and user-agent
    const ip = xForwardedIp ? xForwardedIp : reqIP;
    const userAgent = request.headers['user-agent'];
    // Determine user type
    const user = request['user'];

    return { ip, userAgent, user };
  },
);

export interface IRequestIPAndUserAgent {
  ip: string;
  userAgent: string;
  user?: UserDocument;
}
