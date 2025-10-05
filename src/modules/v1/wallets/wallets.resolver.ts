import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlProtected } from 'src/core/decorators/access.decorator';
import { LoggedInGqlUser } from 'src/core/decorators/logged-in-decorator';
import { CreatedWalletDto } from 'src/graphql/dtos/created-wallet.dto';
import {
  EtherTransactionDto,
  TransactionDto,
  TransactionHashDto,
} from 'src/graphql/dtos/ether-transaction.dto';
import { WalletBalanceDto } from 'src/graphql/dtos/wallet-balance.dto';
import { UserDocument } from '../users/schema/user.schema';
import { TransferFundsInput } from './dto/transfer-funds.input';
import { WalletService } from './wallets.service';
import { AlchemyTransactionDto } from 'src/graphql/dtos/alchemy-transaction.dto';

@Resolver()
export class WalletsResolver {
  constructor(private readonly walletsService: WalletService) {}

  @Mutation(() => CreatedWalletDto)
  @GqlProtected()
  async generateWallet(@LoggedInGqlUser() user: UserDocument) {
    return this.walletsService.createWallet(user);
  }

  @Query(() => WalletBalanceDto)
  @GqlProtected()
  async getWalletBalance(@LoggedInGqlUser() user: UserDocument) {
    return this.walletsService.getWalletBalance(user);
  }

  @Query(() => WalletBalanceDto)
  async getAddressBalance(@Args('address') address: string) {
    return this.walletsService.getAddressBalance(address);
  }

  @Mutation(() => TransactionHashDto)
  @GqlProtected()
  async transferFunds(
    @LoggedInGqlUser() user: UserDocument,
    @Args('input') transferInput: TransferFundsInput,
  ) {
    return this.walletsService.transferFunds(
      user,
      transferInput.toAddress,
      transferInput.amount,
      transferInput.memo,
    );
  }

  @Query(() => [EtherTransactionDto])
  @GqlProtected()
  async getTransactions(
    @LoggedInGqlUser() user: UserDocument,
    @Args('page', {
      nullable: true,
      defaultValue: 1,
      type: () => Int,
    })
    page?: number,
    @Args('pageSize', {
      nullable: true,
      defaultValue: 10,
      type: () => Int,
    })
    pageSize?: number,
  ) {
    return this.walletsService.getTransactions(user, page, pageSize);
  }

  @Query(() => AlchemyTransactionDto)
  async getTransaction(@Args('hash') hash: string) {
    return this.walletsService.getTransactionByHash(hash);
  }
}
