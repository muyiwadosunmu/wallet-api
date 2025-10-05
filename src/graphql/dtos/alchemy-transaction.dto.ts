import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsEthereumAddress } from 'class-validator';

@ObjectType()
export class AlchemyTransactionDto {
  @Field({ nullable: true })
  asset?: string;

  @Field()
  blockNumber: string;

  @Field({ nullable: true })
  category?: string;

  @Field(() => Int)
  confirmations: number;

  @Field()
  @IsEthereumAddress()
  fromAddress: string;

  @Field()
  gasPrice: string;

  @Field()
  gasUsed: string;

  @Field()
  hash: string;

  @Field()
  status: string;

  @Field()
  timestamp: string;

  @Field()
  @IsEthereumAddress()
  toAddress: string;

  @Field()
  value: string;
}
