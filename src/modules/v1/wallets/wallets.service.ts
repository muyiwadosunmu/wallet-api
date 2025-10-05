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
import { EtherscanProvider } from 'src/core/services/etherscan/etherscan.provider';
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
    private walletEtherTransactionDto: Model<WalletTransactionDocument>,
    @InjectModel(Webhook.name)
    public webhookModel: Model<WebhookDocument>,
    @Inject('BlockchainProvider')
    private readonly blockchainProvider: BlockchainProvider,
    private readonly configService: ConfigService,
    private readonly verificationSecurity: VerificationSecurity,
    private readonly etherscanProvider: EtherscanProvider,
  ) {
    this.webhookSecret = this.configService.getOrThrow<string>(
      'ALCHEMY_WEBHOOK_SIGNING_KEY',
    );
    this.network = this.configService.get<string>('ETH_NETWORK') || 'sepolia';
  }

  async createWallet(user: UserDocument): Promise<WalletDocument> {
    // Check if user already has a wallet
    const existingWallet = await this.walletModel.findOne({
      user: user.id,
      isDeleted: false,
    });

    if (existingWallet) {
      throw new BadRequestException('You already have an active wallet');
    }

    // Create a new wallet using blockchain provider, alchemy
    const { address, privateKey, mnemonic } =
      await this.blockchainProvider.createWallet();

    this.blockchainProvider.registerAddressForNotifications(address);

    const hashedPhrase = this.verificationSecurity.hash(mnemonic);

    // Save wallet to database
    const wallet = await this.walletModel.create({
      address,
      privateKey,
      mnemonic,
      hashedMnemonic: hashedPhrase,
      user: user.id,
      network: this.network,
    });

    // await this.blockchainProvider.

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
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new BadRequestException('Invalid Ethereum address format');
      }
      // Get balance from blockchain for any address
      const balance = await this.blockchainProvider.getBalance(address);

      return {
        address,
        balance,
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
    try {
      // Find sender's wallet with privateKey (read-only operation)
      const wallet = await this.walletModel
        .findOne({ user: user.id, isDeleted: false })
        .select('+privateKey');

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

      // Return transaction result directly
      return result;
    } catch (error) {
      // Format appropriate error message based on error type
      if (error.message.includes('Blockchain transaction failed')) {
        throw new BadRequestException(`Transaction failed: ${error.message}`);
      }
      throw new BadRequestException(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get details of a specific transaction by hash
   * @param transactionHash The hash of the transaction to retrieve
   * @returns Transaction details
   */
  async getTransactionByHash(transactionHash: string) {
    if (!transactionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      throw new BadRequestException('Invalid transaction hash format');
    }
    if (!transactionHash) {
      throw new BadRequestException('Transaction hash is required');
    }

    try {
      const transaction = await this.blockchainProvider.getTransaction(
        transactionHash,
      );

      if (!transaction) {
        throw new BadRequestException('Transaction not found');
      }

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      throw new BadRequestException(
        `Failed to retrieve transaction: ${error.message}`,
      );
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
    // Prevent unused parameter lint error
    if (!payload) return;

    try {
      // Extract transaction data from Alchemy webhook
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
    }
  }

  /**
   * Get ERC20 token transactions for the logged-in user's wallet
   * @param user The logged-in user
   * @param page Page number (starts at 1)
   * @param pageSize Number of transactions per page
   * @param contractAddress Optional contract address to filter by
   * @returns Array of token transactions
   */
  async getTransactions(user: UserDocument, page = 1, pageSize = 10) {
    // Find the user's wallet
    const wallet = await this.walletModel.findOne({
      user: user.id,
      isDeleted: false,
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return this.getAddressTransactions(wallet.address, page, pageSize);
  }

  /**
   * Get ERC20 token transactions for any address
   * @param address Ethereum address to get token transactions for
   * @param page Page number (starts at 1)
   * @param pageSize Number of transactions per page
   * @param contractAddress Optional contract address to filter by
   * @returns Array of token transactions
   */
  private async getAddressTransactions(
    address: string,
    page = 1,
    pageSize = 100,
  ) {
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new BadRequestException('Invalid Ethereum address format');
    }

    return this.etherscanProvider.getTokenTransactions(address, page, pageSize);
  }
}
