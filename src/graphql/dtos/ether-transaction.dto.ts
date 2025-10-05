import { ObjectType, Field, Int } from '@nestjs/graphql';
import { IsEthereumAddress, IsOptional } from 'class-validator';

@ObjectType()
export class EtherTransactionDto {
  @Field({ nullable: true })
  asset: string;

  @Field()
  blockNumber: string;

  @Field()
  timeStamp: string;

  @Field()
  hash: string;

  @Field()
  nonce: string;

  @Field()
  blockHash: string;

  @Field()
  transactionIndex: string;

  @Field()
  @IsEthereumAddress()
  from: string;

  @Field()
  @IsEthereumAddress()
  @IsOptional()
  to: string;

  @Field()
  value: string;

  @Field()
  gas: string;

  @Field()
  isError: string;

  @Field()
  txreceipt_status: string;

  @Field({ nullable: true })
  contractAddress: string;

  @Field()
  cumulativeGasUsed: string;

  @Field()
  gasUsed: string;

  @Field(() => Int)
  confirmations: number;
}

@ObjectType()
export class TransactionHashDto {
  @Field()
  hash: string;
}

@ObjectType()
export class TransactionDto {
  @Field()
  hash: string;

  @Field()
  blockHash: string;

  @Field()
  nonce: string;

  @Field()
  @IsEthereumAddress()
  from: string;

  @Field()
  @IsEthereumAddress()
  @IsOptional()
  to: string;

  @Field()
  value: string;

  @Field()
  gas: string;

  @Field({ nullable: true })
  timestamp: Date;

  @Field()
  blockNumber: string;

  @Field({ nullable: true })
  asset?: string;

  @Field({ nullable: true })
  isError: string;

  @Field({ nullable: true })
  txreceipt_status?: string;

  @Field({ nullable: true })
  contractAddress: string;

  @Field({ nullable: true })
  cumulativeGasUsed?: string;

  @Field({ nullable: true })
  gasUsed?: string;

  @Field({ nullable: true })
  confirmations?: number;
}
