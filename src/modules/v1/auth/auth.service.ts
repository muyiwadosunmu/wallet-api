import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VerificationSecurity } from 'src/core/security/verification.security';

import { User, UserDocument } from 'src/modules/v1/users/schema/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserDto: Model<UserDocument>,
    public readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly verificationSecurity: VerificationSecurity,
  ) {}
  /**
   *
   * @param {String} id user id
   * @returns UserDocument
   */
  async getUserById(id: string): Promise<UserDocument> {
    return await this.UserDto.findById(id);
  }

  /**
   *
   * @param {RegisterUserDto} body
   * @returns
   */
  async registerUser(body: RegisterUserDto): Promise<UserDocument> {
    body.email = body.email.trim().toLowerCase();
    const alreadyExist = await this.UserDto.exists({ email: body.email });

    if (alreadyExist)
      throw new ConflictException(
        'A user with this email already exists, Please login to continue or signup with a different email',
      );

    body.password = this.verificationSecurity.hash(body.password);
    const user = await this.UserDto.create(body);
    user.password = undefined;
    return user;
  }

  /**
   *
   * @param {UserDocument} user
   * @returns
   */
  async generateToken(user: UserDocument) {
    const payload = { sub: user.id };
    const token = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRY'),
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
    });
    return token;
  }

  /**
   *
   * @param {LoginDto} body
   * @returns
   */
  async login(body: LoginDto) {
    //Check for email in web and mobile db
    body.email = body.email.trim().toLowerCase();
    const user = await this.UserDto.findOne({
      email: body.email,
    }).select('+password');

    if (!user)
      throw new BadRequestException(
        'No user found with this details, Please sign up',
      );

    if (user.suspended)
      throw new BadRequestException('Account is suspended, contact support');

    //Check password
    const isPasswordCorrect = this.verificationSecurity.compare(
      body.password,
      user.password,
    );

    if (!isPasswordCorrect) throw new BadRequestException('Incorrect Password');

    return {
      token: await this.generateToken(user),
      id: user.id,
    };
  }
}
