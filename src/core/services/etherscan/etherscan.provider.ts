import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { BlockchainProvider } from '../interfaces/blockchain.interface';
import {
  EtherscanTokenTransaction,
  EtherscanTokenTransactionResponse,
} from './interfaces/etherscan.interfaces';

@Injectable()
export class EtherscanProvider implements Partial<BlockchainProvider> {
  private readonly logger = new Logger(EtherscanProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('ETHERSCAN_API_KEY');
    const network = this.configService.get<string>('ETH_NETWORK') || 'sepolia';

    this.baseUrl = `https://api-${network}.etherscan.io/api`;
  }

  /**
   * Get transactions for an address with pagination
   * @param address Ethereum address to get token transactions for
   * @param page Page number (starts from 1)
   * @param pageSize Number of transactions per page (offset in Etherscan API)
   * @param contractAddress Optional ERC20 token contract address to filter by
   * @returns Array of token transactions with pagination info
   */
  async getTokenTransactions(
    address: string,
    page = 1,
    pageSize = 10,
  ): Promise<any[]> {
    try {
      this.logger.log(`Fetching token transactions for ${address}`);

      // Build query parameters
      const params: Record<string, string> = {
        module: 'account',
        action: 'txlist',
        address,
        page: page.toString(),
        offset: pageSize.toString(),
        startblock: '0',
        endblock: '99999999',
        sort: 'desc',
        apikey: this.apiKey,
      };

      // Make API call
      const response: AxiosResponse<any> = await lastValueFrom(
        this.httpService.get<any>(this.baseUrl, { params }),
      );

      const { data } = response;

      if (data.status !== '1') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }

      // Calculate pagination metadata
      const result = data.result.map((tx) => ({
        ...tx,
        page,
        totalItems:
          data.result.length < pageSize ? data.result.length : undefined,
        totalPages: data.result.length < pageSize ? 1 : undefined,
      }));

      return result;
    } catch (error) {
      console.log(error);
      this.logger.error(`Failed to get token transactions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get transaction details by hash
   * This is a placeholder implementation to satisfy the BlockchainProvider interfacee
   */
  async getTransaction(txHash: string): Promise<any> {
    try {
      const params = {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: txHash,
        apikey: this.apiKey,
      };

      const response: AxiosResponse<any> = await lastValueFrom(
        this.httpService.get(this.baseUrl, { params }),
      );

      return response.data.result;
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      return null;
    }
  }

  /**
   * Get balance for an address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const params = {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: this.apiKey,
      };

      const response: AxiosResponse<any> = await lastValueFrom(
        this.httpService.get(this.baseUrl, { params }),
      );

      if (response.data.status !== '1') {
        throw new Error(`Etherscan API error: ${response.data.message}`);
      }

      // Convert wei to ether
      const balanceInWei = response.data.result;
      const balanceInEther = parseFloat(balanceInWei) / 1e18;

      return balanceInEther.toString();
    } catch (error) {
      this.logger.error(`Failed to get balance: ${error.message}`);
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }
}
