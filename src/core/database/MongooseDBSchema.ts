import { ModelDefinition } from '@nestjs/mongoose';
import UserSchema, { User } from 'src/modules/v1/users/schema/user.schema';

export const MongoDBSchema: ModelDefinition[] = [
  {
    name: User.name,
    schema: UserSchema,
  },
];
