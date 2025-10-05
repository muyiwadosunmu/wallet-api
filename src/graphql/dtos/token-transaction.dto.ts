import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsEthereumAddress, IsOptional } from 'class-validator';

@ObjectType()
export class TokenTransactionDto {
  @Field()
  hash: string;

  @Field()
  blockNumber: string;

  @Field()
  timeStamp: string;

  @Field()
  @IsEthereumAddress()
  from: string;

  @Field()
  @IsEthereumAddress()
  to: string;

  @Field()
  @IsEthereumAddress()
  contractAddress: string;

  @Field()
  value: string;

  @Field()
  tokenName: string;

  @Field()
  tokenSymbol: string;

  @Field()
  tokenDecimal: string;

  @Field()
  transactionIndex: string;

  @Field()
  gas: string;

  @Field()
  gasPrice: string;

  @Field()
  gasUsed: string;

  @Field()
  cumulativeGasUsed: string;

  @Field()
  methodId: string;

  @Field({ nullable: true })
  functionName?: string;

  @Field(() => Int)
  confirmations: number;

  // Pagination fields
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  totalPages?: number;

  @Field(() => Int, { nullable: true })
  totalItems?: number;
}
