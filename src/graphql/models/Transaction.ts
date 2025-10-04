import { ObjectType, Field } from '@nestjs/graphql';
import { IsEthereumAddress } from 'class-validator';

@ObjectType()
export class TransactionModel {
  @Field()
  hash: string;

  @Field()
  @IsEthereumAddress()
  fromAddress: string;

  @Field()
  @IsEthereumAddress()
  toAddress: string;

  @Field()
  amount: string;

  @Field({ nullable: true })
  memo?: string;

  @Field()
  network: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
