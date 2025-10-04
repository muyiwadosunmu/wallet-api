import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlProtected } from 'src/core/decorators/access.decorator';
import { LoggedInGqlUser } from 'src/core/decorators/logged-in-decorator';
import { UserDocument } from '../users/schema/user.schema';
import { CreateWalletInput } from './dto/create-wallet.input';
import { Wallet } from './schema/wallet.schema';
import { WalletService } from './wallets.service';
import { CreatedWalletModel } from 'src/graphql/models/Wallet';
import { WalletBalanceModel } from 'src/graphql/models/WalletBalance';
import { TransactionModel } from 'src/graphql/models/Transaction';
import { TransferFundsInput } from './dto/transfer-funds.input';

@Resolver()
export class WalletsResolver {
  constructor(private readonly walletsService: WalletService) {}

  @Mutation(() => CreatedWalletModel)
  @GqlProtected()
  async generateWallet(
    @LoggedInGqlUser() user: UserDocument,
    // @Args('') createWalletInput: CreateWalletInput,
  ) {
    return this.walletsService.createWallet(user);
  }

  @Query(() => WalletBalanceModel)
  @GqlProtected()
  async getWalletBalance(@LoggedInGqlUser() user: UserDocument) {
    return this.walletsService.getWalletBalance(user);
  }

  @Query(() => WalletBalanceModel)
  async getAddressBalance(@Args('address') address: string) {
    // Basic validation for Ethereum address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid Ethereum address format');
    }

    return this.walletsService.getAddressBalance(address);
  }

  @Mutation(() => TransactionModel)
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
