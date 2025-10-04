import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthDto {
  @Field()
  token: string;

  @Field()
  id: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;
}
