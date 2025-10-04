import { Query, Resolver } from '@nestjs/graphql';
import { UserDto } from 'src/graphql/models/user.dto';

@Resolver()
export class UserResolver {
  @Query(() => UserDto)
  getUsers() {
    return {
      id: '01',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      suspended: false,
      deleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
