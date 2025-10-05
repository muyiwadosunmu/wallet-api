import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlProtected } from 'src/core/decorators/access.decorator';
import { LoggedInGqlUser } from 'src/core/decorators/logged-in-decorator';
import { UserDocument } from '../users/schema/user.schema';
import { CreateWalletInput } from './dto/create-wallet.input';
import { Wallet } from './schema/wallet.schema';
import { WalletService } from './wallets.service';
import { CreatedWalletDto } from 'src/graphql/dtos/created-wallet.dto';
import { WalletBalanceDto } from 'src/graphql/dtos/wallet-balance.dto';
import { TransactionDto } from 'src/graphql/dtos/transaction.dto';
import { TransferFundsInput } from './dto/transfer-funds.input';

@Resolver()
export class WalletsResolver {
  constructor(private readonly walletsService: WalletService) {}

  @Mutation(() => CreatedWalletDto)
  @GqlProtected()
  async generateWallet(
    @LoggedInGqlUser() user: UserDocument,
    // @Args('') createWalletInput: CreateWalletInput,
  ) {
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

  @Mutation(() => TransactionDto)
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

  @Query(() => [TransactionDto])
  @GqlProtected()
  async getTransactions(@LoggedInGqlUser() user: UserDocument) {
    return this.walletsService.getTransactions(user);
  }

  @Query(() => TransactionDto)
  async getTransaction(@Args('hash') hash: string) {
    // Basic validation for transaction hash format

    return this.walletsService.getTransactionByHash(hash);
  }

  // @Query(() => [Wallet], { name: 'wallets' })
  // findAll() {
  //   return this.walletsService.findAll();
  // }

  // @Query(() => Wallet, { name: 'wallet' })
  // findOne(@Args('id', { type: () => Int }) id: number) {
  //   return this.walletsService.findOne(id);
  // }

  // @Mutation(() => Wallet)
  // updateWallet(
  //   @Args('updateWalletInput') updateWalletInput: UpdateWalletInput,
  // ) {
  //   return this.walletsService.update(updateWalletInput.id, updateWalletInput);
  // }

  // @Mutation(() => Wallet)
  // removeWallet(@Args('id', { type: () => Int }) id: number) {
  //   return this.walletsService.remove(id);
  // }
}
