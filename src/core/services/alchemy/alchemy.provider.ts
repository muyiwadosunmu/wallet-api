import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Alchemy,
  AssetTransfersCategory,
  Network,
  Utils,
  NotifyNamespace,
} from 'alchemy-sdk';
import { ethers } from 'ethers';
import { BlockchainProvider } from '../interfaces/blockchain.interface';

@Injectable()
export class AlchemyProvider implements BlockchainProvider {
  private readonly alchemy: Alchemy;
  private readonly notifyApi: NotifyNamespace;
  private readonly logger = new Logger(AlchemyProvider.name);
  private readonly webhookId: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('ALCHEMY_API_KEY');
    this.webhookId =
      this.configService.getOrThrow<string>('ALCHEMY_WEBHOOK_ID');

    // Map network string to Alchemy Network type
    let alchemyNetwork = Network.ETH_SEPOLIA;
    if (process.env.NODE_ENV === 'development') {
      alchemyNetwork = Network.ETH_SEPOLIA;
    } else {
      alchemyNetwork = Network.ETH_MAINNET;
    }

    // Initialize Alchemy SDK
    this.alchemy = new Alchemy({
      apiKey,
      network: alchemyNetwork,
    });

    this.notifyApi = this.alchemy.notify;
  }
  getGasPrice(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async registerAddressForNotifications(address: string): Promise<boolean> {
    try {
      if (!this.webhookId) {
        this.logger.warn(
          'No webhook ID configured, skipping address registration',
        );
        return false;
      }

      // Normalize address format
      const formattedAddress = address.trim();

      // Add address to webhook monitoring
      await this.notifyApi.updateWebhook(this.webhookId, {
        addAddresses: [formattedAddress],
      });

      this.logger.log(
        `Successfully registered address ${formattedAddress} for notifications`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to register address for notifications: ${error.message}`,
      );
      return false;
    }
  }

  async createWallet(): Promise<{
    address: string;
    privateKey: string;
    mnemonic: string;
  }> {
    const wallet = ethers.Wallet.createRandom();
    return {
      mnemonic: wallet.mnemonic.phrase,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balanceHex = await this.alchemy.core.getBalance(address);
      const balanceInEther = Utils.formatEther(balanceHex);
      return balanceInEther;
    } catch (error) {
      this.logger.error(
        `Failed to get balance for ${address}: ${error.message}`,
      );
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  async sendTransaction(
    fromPrivateKey: string,
    toAddress: string,
    amount: number,
  ): Promise<any> {
    try {
      // Create a provider from Alchemy
      const network =
        this.configService.get<string>('ETH_NETWORK') || 'sepolia';
      const provider = new ethers.AlchemyProvider(
        network,
        this.configService.get<string>('ALCHEMY_API_KEY'),
      );

      // Create wallet with private key and provider
      const wallet = new ethers.Wallet(fromPrivateKey, provider);

      // Create transaction object
      const tx = {
        to: toAddress,
        value: ethers.parseEther(amount.toString()),
      };

      // Send transaction
      const transaction = await wallet.sendTransaction(tx);
      await transaction.wait(); // Wait for transaction to be mined

      return { hash: transaction.hash };
    } catch (error) {
      this.logger.error(`Transaction failed: ${error.message}`);
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
  }

  async getTransactionHistory(address: string): Promise<
    {
      hash: string;
      from: string;
      to: string;
      value: string;
      timestamp: Date;
      status: string;
      blockNumber: string;
      asset: string;
      category: AssetTransfersCategory;
    }[]
  > {
    try {
      // Fetch sent transactions
      const sentTransactions = await this.alchemy.core.getAssetTransfers({
        fromBlock: '0x0',
        fromAddress: address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
        ],
        maxCount: 100,
      });

      // Fetch received transactions
      const receivedTransactions = await this.alchemy.core.getAssetTransfers({
        fromBlock: '0x0',
        toAddress: address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
        ],
        maxCount: 100,
      });

      // Combine and process transactions
      const allTransfers = [
        ...sentTransactions.transfers,
        ...receivedTransactions.transfers,
      ];

      // Sort by block number in descending order
      allTransfers.sort((a, b) => {
        const aBlockNum = a.blockNum ? parseInt(a.blockNum, 16) : 0;
        const bBlockNum = b.blockNum ? parseInt(b.blockNum, 16) : 0;
        return bBlockNum - aBlockNum;
      });

      // Take the most recent 20 transactions
      const recentTransfers = allTransfers.slice(0, 20);

      // Format transactions into our standard interface
      const transactions = await Promise.all(
        recentTransfers.map(async (transfer) => {
          // Get transaction receipt for additional details if available
          let status = 'Confirmed';
          let timestamp = new Date();

          if (transfer.hash) {
            try {
              const receipt = await this.alchemy.core.getTransactionReceipt(
                transfer.hash,
              );
              status = receipt?.status ? 'Confirmed' : 'Failed';

              // Try to get the block for timestamp
              if (transfer.blockNum) {
                const block = await this.alchemy.core.getBlock(
                  transfer.blockNum,
                );
                if (block?.timestamp) {
                  timestamp = new Date(block.timestamp * 1000);
                }
              }
            } catch (error) {
              this.logger.warn(
                `Could not get receipt for tx ${transfer.hash}: ${error.message}`,
              );
            }
          }

          return {
            hash: transfer.hash || 'unknown',
            from: transfer.from || 'unknown',
            to: transfer.to || 'unknown',
            value: transfer.value ? transfer.value.toString() : '0',
            timestamp,
            status,
            blockNumber: transfer.blockNum,
            asset: transfer.asset || 'ETH',
            category: transfer.category,
          };
        }),
      );

      return transactions;
    } catch (error) {
      this.logger.error(`Failed to get transaction history: ${error.message}`);
      return [];
    }
  }
}
