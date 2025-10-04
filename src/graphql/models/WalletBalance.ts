import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class WalletBalanceModel {
  @Field()
  address: string;

  @Field()
  balance: string;

  @Field()
  network: string;

  @Field({ nullable: true })
  formattedBalance?: string;

  @Field({ nullable: true })
  usdValue?: string;

  @Field()
  lastUpdated: Date;
}
