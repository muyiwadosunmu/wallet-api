import { Query, Resolver } from '@nestjs/graphql';
import { UserModel } from 'src/graphql/models/User';

@Resolver()
export class UserResolver {
  @Query(() => UserModel)
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
