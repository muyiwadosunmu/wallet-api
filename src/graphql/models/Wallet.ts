import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserModel } from './User';
import { User } from 'src/modules/v1/users/schema/user.schema';

@ObjectType()
export class CreatedWalletModel {
  @Field(() => ID)
  id: string;

  @Field()
  address: string;

  privateKey?: string;

  @Field({ nullable: true })
  mnemonic?: string;

  hashedMnemonic: string;

  @Field({ nullable: true })
  balance: string;

  @Field({ nullable: true })
  network: string;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => Boolean)
  isDeleted: boolean;

  @Field(() => Date, { nullable: true })
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}
