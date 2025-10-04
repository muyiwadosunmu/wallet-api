import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlProtected } from 'src/core/decorators/access.decorator';
import { LoggedInGqlUser } from 'src/core/decorators/logged-in-decorator';
import { AuthService } from 'src/modules/v1/auth/auth.service';
import { LoginInput, RegisterInput } from './dto/auth.input';
import {
  CreatedUserDto,
  LoggedInUserDto,
  UserDto,
} from 'src/graphql/models/user.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => UserDto)
  @GqlProtected()
  async me(@LoggedInGqlUser() user: UserDto): Promise<UserDto> {
    return user;
  }

  @Mutation(() => CreatedUserDto)
  async register(@Args('input') body: RegisterInput): Promise<CreatedUserDto> {
    const user = await this.authService.registerUser(body);
    const newUser: CreatedUserDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return newUser;
  }

  @Mutation(() => LoggedInUserDto)
  async login(@Args('input') loginInput: LoginInput): Promise<LoggedInUserDto> {
    return this.authService.login(loginInput);
  }
}
