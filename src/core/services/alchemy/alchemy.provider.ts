import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Alchemy, AssetTransfersCategory, Network, Utils } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { BlockchainProvider } from '../interfaces/blockchain.interface';

@Injectable()
export class AlchemyProvider implements BlockchainProvider {
  private readonly alchemy: Alchemy;
  private readonly logger = new Logger(AlchemyProvider.name);
  webhookId = this.configService.getOrThrow<string>('ALCHEMY_WEBHOOK_ID');
  network = this.configService.get<string>('ETH_NETWORK') || 'sepolia';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('ALCHEMY_API_KEY');
    const authToken = this.configService.get<string>('ALCHEMY_AUTH_TOKEN');

    // Map network string to Alchemy Network type
    let alchemyNetwork = Network.ETH_SEPOLIA;
    if (process.env.NODE_ENV === 'development') {
      alchemyNetwork = Network.ETH_SEPOLIA;
    }

    // Initialize Alchemy SDK
    this.alchemy = new Alchemy({
      apiKey,
      network: alchemyNetwork,
      ...(authToken && {
        authToken,
      }),
    });
  }

  provider = new ethers.AlchemyProvider(
    this.network,
    this.configService.get<string>('ALCHEMY_API_KEY'),
  );

  getGasPrice(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  /**
   * Get a single transaction by hash
   * @param txHash The transaction hash to lookup
   * @returns Transaction details or null if not found
   */
  async getTransaction(txHash: string): Promise<{
    hash: string;
    fromAddress: string;
    toAddress: string;
    value: string;
    timestamp: Date;
    status: string;
    blockNumber: string;
    gasUsed?: string;
    gasPrice?: string;
    confirmations: number;
  } | null> {
    try {
      // Get transaction details
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return null; // Transaction not found
      }

      // Get transaction receipt for status and gas used
      const receipt = await this.provider.getTransactionReceipt(txHash);

      // Get block for timestamp
      let timestamp = new Date();
      if (tx.blockNumber) {
        const block = await this.provider.getBlock(tx.blockNumber);
        if (block?.timestamp) {
          timestamp = new Date(Number(block.timestamp) * 1000);
        }
      }

      // Get current block for confirmations
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = tx.blockNumber
        ? currentBlock - tx.blockNumber + 1
        : 0;

      // Determine status
      let status = 'pending';
      if (receipt) {
        status = receipt.status ? 'confirmed' : 'failed';
      } else if (confirmations > 0) {
        status = 'confirmed';
      }

      return {
        hash: tx.hash,
        fromAddress: tx.from,
        toAddress: tx.to || '0x0000000000000000000000000000000000000000',
        value: ethers.formatEther(tx.value),
        timestamp,
        status,
        blockNumber: tx.blockNumber
          ? `0x${tx.blockNumber.toString(16)}`
          : '0x0',
        gasUsed: receipt ? receipt.gasUsed.toString() : undefined,
        gasPrice: tx.gasPrice
          ? ethers.formatUnits(tx.gasPrice, 'gwei')
          : undefined,
        confirmations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get transaction ${txHash}: ${error.message}`,
      );
      return null;
    }
  }

  async registerAddressForNotifications(address: string): Promise<boolean> {
    try {
      // Normalize address format
      const formattedAddress = address.trim();

      // Add address to webhook monitoring
      await this.alchemy.notify.updateWebhook(this.webhookId, {
        addAddresses: [formattedAddress],
      });

      this.logger.log(
        `Successfully registered address ${formattedAddress} for notifications`,
      );
      return true;
    } catch (error) {
      console.error('Error registering address for notifications:', error);
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

      // Create wallet with private key and provider
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);

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
      fromAddress: string;
      toAddress: string;
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
        maxCount: 10,
      });

      console.log('Sent Transactions:', sentTransactions);

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
        maxCount: 10,
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
            fromAddress: transfer.from || 'unknown',
            toAddress: transfer.to || 'unknown',
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
