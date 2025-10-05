import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RequestHeaders } from '../constant/header.constant';
import { AuthService } from 'src/modules/v1/auth/auth.service';
import { IRequest } from '../constant/response.constant';
import { UserDocument } from 'src/modules/v1/users/schema/user.schema';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    // Get GraphQL context which contains the request
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const user = await this.checkUser(request);
    console.log(user);

    // Add the user to the GraphQL context for access in resolvers
    ctx.getContext().user = user;

    return true;
  }

  async checkUser(request: IRequest): Promise<UserDocument> {
    // 1. Extract the token from header
    const token = this.extractBearerToken(request);
    // console.log(token);

    // 2. Verify token is valid and for user
    const { id } = await this.verifyToken(token);

    // user information to request.user
    const user = await this.authService.getUserById(id);

    if (user.suspended)
      throw new BadRequestException(
        'This account has been suspended, contact support support@cotrackr.com',
      );

    if (user.deleted)
      throw new BadRequestException(
        'This account has been deleted, contact support support@cotrackr.com',
      );

    request.user = user;
    return user;
  }

  /**
   * @method extractBearerToken
   * @param {Request}request request
   * @description This method extracts bearer token from request
   * @return token
   */
  private extractBearerToken(request: IRequest) {
    const token = request.headers[RequestHeaders.AUTHORIZATION]?.split(' ')[1];
    // console.log(request.headers);
    // console.log(token);

    if (!token) throw new UnauthorizedException('Please login to gain access');

    return token;
  }

  /**
   * @method verifyToken
   *
   * @param {string} token token
   * @description This method verifies token & extracts information
   * @return Id
   */
  private async verifyToken(token: string) {
    let data;
    try {
      data = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
    } catch (e) {
      console.log(e.message);
      throw new HttpException('Session expired, refresh token', 440);
    }
    if (!data.sub)
      throw new ForbiddenException('Invalid Token, provide access token');
    // token verification for user
    return { id: data.sub };
  }
}
