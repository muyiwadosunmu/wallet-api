import { Field, Float, InputType } from '@nestjs/graphql';
import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

@InputType()
export class TransferFundsInput {
  @Field()
  @IsEthereumAddress()
  @IsNotEmpty()
  toAddress: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.000001, { message: 'Amount must be at least 0.000001 ETH' })
  amount: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  memo?: string;
}
