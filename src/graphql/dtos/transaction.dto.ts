import { ObjectType, Field } from '@nestjs/graphql';
import { IsEthereumAddress, IsOptional } from 'class-validator';

@ObjectType()
export class TransactionDto {
  @Field()
  hash: string;

  @Field()
  @IsEthereumAddress()
  fromAddress: string;

  @Field()
  @IsEthereumAddress()
  @IsOptional()
  toAddress: string;

  @Field()
  value: string;

  @Field()
  timestamp: Date;

  @Field()
  status: string;

  @Field()
  blockNumber: string;

  @Field({ nullable: true })
  asset?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  gasUsed?: string;

  @Field({ nullable: true })
  gasPrice?: string;

  @Field({ nullable: true })
  confirmations?: number;
}
