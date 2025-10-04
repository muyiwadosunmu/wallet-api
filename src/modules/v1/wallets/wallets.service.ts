import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet } from 'alchemy-sdk';
import { Model } from 'mongoose';
import * as crypto from 'node:crypto';
import { VerificationSecurity } from 'src/core/security/verification.security';
import { BlockchainProvider } from 'src/core/services/interfaces/blockchain.interface';
import { UserDocument } from '../users/schema/user.schema';
import { WalletDocument } from './schema/wallet.schema';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from './schema/wallet.transaction.schema';
import { Webhook, WebhookDocument } from './schema/webhook.schems';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private webhookSecret: string;
  private network: string;

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(Webhook.name)
    public webhookModel: Model<WebhookDocument>,
    @Inject('BlockchainProvider')
    private readonly blockchainProvider: BlockchainProvider,
    private readonly configService: ConfigService,
    private readonly verificationSecurity: VerificationSecurity,
  ) {
    this.webhookSecret = this.configService.getOrThrow<string>(
      'ALCHEMY_WEBHOOK_SIGNING_KEY',
    );
  }

  async createWallet(
    user: UserDocument,
    // createWalletDto: CreateWalletInput,
  ): Promise<WalletDocument> {
    // Check if user already has a wallet
    const network = this.configService.get<string>('ETH_NETWORK') || 'sepolia';
    const existingWallet = await this.walletModel.findOne({
      user: user.id,
      isDeleted: false,
    });

    if (existingWallet) {
      throw new BadRequestException('You already have an active wallet');
    }

    // Create a new wallet using blockchain provider
    const { address, privateKey, mnemonic } =
      await this.blockchainProvider.createWallet();

    const hashedPhrase = this.verificationSecurity.hash(mnemonic);

    // Save wallet to database
    const wallet = await this.walletModel.create({
      address,
      privateKey,
      mnemonic,
      hashedMnemonic: hashedPhrase,
      user: user.id,
      network,
    });

    // Update initial balance
    const balance = await this.blockchainProvider.getBalance(address);
    wallet.balance = balance;
    await wallet.save();

    return wallet;
  }

  async getWalletBalance(user: UserDocument) {
    // Find the user's wallet
    const wallet = await this.walletModel.findOne({
      user: user.id,
      isDeleted: false,
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    // Get fresh balance from blockchain
    const balance = await this.blockchainProvider.getBalance(wallet.address);

    // Update wallet balance in database
    wallet.balance = balance;
    await wallet.save();

    // Return wallet balance info
    return {
      address: wallet.address,
      balance: wallet.balance,
      network: wallet.network,
      formattedBalance: `${parseFloat(balance).toFixed(6)} ETH`,
      // Could add price conversion here if you add a price feed service
      usdValue: 'N/A',
      lastUpdated: new Date(),
    };
  }

  async getAddressBalance(address: string) {
    try {
      // Get balance from blockchain for any address
      const balance = await this.blockchainProvider.getBalance(address);

      return {
        address: address,
        balance: balance,
        network: this.configService.get<string>('ETH_NETWORK') || 'sepolia',
        formattedBalance: `${parseFloat(balance).toFixed(6)} ETH`,
        usdValue: null,
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get balance: ${error.message}`);
    }
  }

  async transferFunds(
    user: UserDocument,
    toAddress: string,
    amount: number,
    memo?: string,
  ) {
    // Start a session for transaction
    const session = await this.walletModel.startSession();
    session.startTransaction();

    try {
      // Find sender's wallet with privateKey
      const wallet = await this.walletModel
        .findOne({ user: user.id, isDeleted: false })
        .select('+privateKey')
        .session(session);

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      if (wallet.address == toAddress) {
        throw new BadRequestException('Cannot transfer to your own address');
      }

      // Get fresh balance from blockchain
      const balance = await this.blockchainProvider.getBalance(wallet.address);
      const amountFloat = parseFloat(amount.toString());

      // Check if sender has enough funds (including a buffer for gas)
      const estimatedGas = 0.0001;
      if (parseFloat(balance) < amountFloat + estimatedGas) {
        throw new BadRequestException(
          `Insufficient funds. You need at least ${
            amountFloat + estimatedGas
          } ETH (including gas fees)`,
        );
      }

      // Execute the transaction on blockchain
      const result = await this.blockchainProvider.sendTransaction(
        wallet.privateKey,
        toAddress,
        amountFloat,
      );

      // Update wallet balance in DB
      const newBalance = Math.max(
        0,
        parseFloat(balance) - amountFloat - estimatedGas,
      ).toString();
      wallet.balance = newBalance;
      await wallet.save({ session });

      // Record the transaction in DB
      const [walletTransaction] = await this.walletTransactionModel.create(
        [
          {
            hash: result.hash,
            fromAddress: wallet.address,
            toAddress,
            amount: amount.toString(),
            memo: memo || '',
            network: wallet.network,
            status: 'pending',
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return walletTransaction;
    } catch (error) {
      // A single catch block to handle all errors
      await session.abortTransaction().catch(() => {
        // Ignore errors on abort - it might already be aborted
        // This is a safer approach than tracking state
      });
      session.endSession();

      // Format appropriate error message based on error type
      if (error.message.includes('Blockchain transaction failed')) {
        throw new BadRequestException(`Transaction failed: ${error.message}`);
      }
      throw new BadRequestException(`Transaction failed: ${error.message}`);
    }
  }

  async verifyWebhookSignature(
    rawBody: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const webhookSecret = this.configService.getOrThrow<string>(
        'ALCHEMY_WEBHOOK_SIGNING_KEY',
      );

      const hmac = crypto.createHmac('sha256', webhookSecret);
      const calculatedSignature = hmac.update(rawBody, 'utf8').digest('hex');
      console.log(calculatedSignature, signature);

      return signature === calculatedSignature;
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Process webhook event from Alchemy
   */
  async processWebhookEvent(payload: any): Promise<void> {
    return;
    try {
      // Extract transaction data from Alchemy webhook
      const event = payload.event || {};
      const transaction = event.data?.transaction || event.transaction;

      if (!transaction?.hash) {
        this.logger.warn('Webhook payload missing transaction hash');
        return;
      }

      const txHash = transaction.hash;
      this.logger.log(`Processing transaction webhook for hash: ${txHash}`);

      // Find the transaction in our database
      const walletTx = await this.walletTransactionModel.findOne({
        hash: txHash,
      });
      if (!walletTx) {
        this.logger.warn(
          `Transaction with hash ${txHash} not found in database`,
        );
        return;
      }

      // Determine transaction status
      let newStatus = 'pending';

      // Different event types in Alchemy
      switch (event.type) {
        case 'MINED_TRANSACTION':
          newStatus = 'confirmed';
          break;
        case 'DROPPED_TRANSACTION':
          newStatus = 'failed';
          break;
      }

      // If the transaction has confirmations field, we can update based on that
      if (
        transaction.confirmations &&
        parseInt(transaction.confirmations) >= 1
      ) {
        newStatus = 'confirmed';
      }

      // If blockchain status available, use that
      switch (transaction.status) {
        case '0x1':
          newStatus = 'confirmed';
          break;
        case '0x0':
          newStatus = 'failed';
          break;
      }

      // Skip if status hasn't changed
      if (walletTx.status === newStatus) {
        this.logger.log(`Transaction ${txHash} status unchanged: ${newStatus}`);
        return;
      }

      // Update transaction status
      //   const oldStatus = walletTx.status;
      //   walletTx.status = newStatus;
      //   walletTx.blockNumber = transaction.blockNumber || walletTx.blockNumber;
      //   walletTx.blockHash = transaction.blockHash || walletTx.blockHash;
      //   walletTx.updatedAt = new Date();

      await walletTx.save();
      //   this.logger.log(
      //     `Updated transaction ${txHash} status from ${oldStatus} to ${newStatus}`,
      //   );

      //   // If transaction failed, update wallet balances accordingly
      //   if (newStatus === 'failed' && walletTx.fromAddress) {
      //     await this.handleFailedTransaction(walletTx);
      //   }

      //   // Publish event to GraphQL subscriptions
      //   this.publishTransactionUpdate(walletTx);
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
    }
  }
}
