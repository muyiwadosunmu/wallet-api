import { Test, TestingModule } from '@nestjs/testing';
import { WalletsResolver } from './wallets.resolver';
import { WalletService } from './wallets.service';
import { UserDocument } from '../users/schema/user.schema';
import { CreatedWalletDto } from 'src/graphql/dtos/created-wallet.dto';
import { WalletBalanceDto } from 'src/graphql/dtos/wallet-balance.dto';
import { TransferFundsInput } from 'src/graphql/dtos/transfer-funds.input';
import {
  EtherTransactionDto,
  TransactionHashDto,
} from 'src/graphql/dtos/ether-transaction.dto';
import { AlchemyTransactionDto } from 'src/graphql/dtos/alchemy-transaction.dto';

// Mock the decorators
jest.mock('src/core/decorators/access.decorator', () => ({
  GqlProtected: () => jest.fn(),
}));

jest.mock('src/core/decorators/logged-in-decorator', () => ({
  LoggedInGqlUser: () => jest.fn(),
}));

describe('WalletsResolver', () => {
  let resolver: WalletsResolver;
  let walletService: WalletService;

  // Create mock user document
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    suspended: false,
    deleted: false,
  } as UserDocument;

  // Create mock wallet data
  const mockCreatedWallet: CreatedWalletDto = {
    id: 'wallet123',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    balance: '1.5',
    network: 'sepolia',
    isDeleted: false,
    mnemonic: 'test test test test test test test test test test test test',
    hashedMnemonic: 'hashedphrase',
    user: mockUser as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWalletBalance: WalletBalanceDto = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    balance: '1.5',
    network: 'sepolia',
    formattedBalance: '1.500000 ETH',
    usdValue: 'N/A',
    lastUpdated: new Date(),
  };

  const mockTransactionHash: TransactionHashDto = {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  };

  const mockTransactions: EtherTransactionDto[] = [
    {
      asset: 'ETH',
      blockNumber: '12345',
      timeStamp: '1633042800',
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      nonce: '1',
      blockHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      transactionIndex: '0',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      value: '1000000000000000000',
      gas: '21000',
      isError: '0',
      txreceipt_status: '1',
      contractAddress: null,
      cumulativeGasUsed: '21000',
      gasUsed: '21000',
      confirmations: 10,
    },
  ];

  const mockAlchemyTransaction: AlchemyTransactionDto = {
    asset: 'ETH',
    blockNumber: '12345',
    category: 'external',
    confirmations: 10,
    fromAddress: '0x1234567890abcdef1234567890abcdef12345678',
    gasPrice: '20000000000',
    gasUsed: '21000',
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    status: 'confirmed',
    timestamp: '1633042800',
    toAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    value: '1000000000000000000',
  };

  // Create mock service
  const mockWalletService = {
    createWallet: jest.fn().mockResolvedValue(mockCreatedWallet),
    getWalletBalance: jest.fn().mockResolvedValue(mockWalletBalance),
    getAddressBalance: jest.fn().mockResolvedValue(mockWalletBalance),
    transferFunds: jest.fn().mockResolvedValue(mockTransactionHash),
    getTransactions: jest.fn().mockResolvedValue(mockTransactions),
    getTransactionByHash: jest.fn().mockResolvedValue(mockAlchemyTransaction),
  };

  beforeEach(async () => {
    // Reset mocks between tests
    jest.clearAllMocks();

    // Create a test module for each test
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsResolver,
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    resolver = module.get<WalletsResolver>(WalletsResolver);
    walletService = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('generateWallet', () => {
    it('should generate a new wallet', async () => {
      // Act
      const result = await resolver.generateWallet(mockUser);

      // Assert
      expect(mockWalletService.createWallet).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockCreatedWallet);
    });
  });

  describe('getWalletBalance', () => {
    it('should return the wallet balance for a user', async () => {
      // Act
      const result = await resolver.getWalletBalance(mockUser);

      // Assert
      expect(mockWalletService.getWalletBalance).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockWalletBalance);
    });
  });

  describe('getAddressBalance', () => {
    it('should return balance for a given address', async () => {
      // Arrange
      const address = '0x1234567890abcdef1234567890abcdef12345678';

      // Act
      const result = await resolver.getAddressBalance(address);

      // Assert
      expect(mockWalletService.getAddressBalance).toHaveBeenCalledWith(address);
      expect(result).toEqual(mockWalletBalance);
    });
  });

  describe('transferFunds', () => {
    it('should transfer funds and return transaction hash', async () => {
      // Arrange
      const transferInput: TransferFundsInput = {
        toAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amount: 1.0,
        memo: 'Test payment',
      };

      // Act
      const result = await resolver.transferFunds(mockUser, transferInput);

      // Assert
      expect(mockWalletService.transferFunds).toHaveBeenCalledWith(
        mockUser,
        transferInput.toAddress,
        transferInput.amount,
        transferInput.memo,
      );
      expect(result).toEqual(mockTransactionHash);
    });
  });

  describe('getTransactions', () => {
    it('should return transactions for a user with default pagination', async () => {
      // Act
      const result = await resolver.getTransactions(mockUser, 1, 10);

      // Assert
      expect(mockWalletService.getTransactions).toHaveBeenCalledWith(
        mockUser,
        1,
        10,
      );
      expect(result).toEqual(mockTransactions);
    });

    it('should return transactions with custom pagination', async () => {
      // Arrange
      const page = 2;
      const pageSize = 20;

      // Act
      const result = await resolver.getTransactions(mockUser, page, pageSize);

      // Assert
      expect(mockWalletService.getTransactions).toHaveBeenCalledWith(
        mockUser,
        page,
        pageSize,
      );
      expect(result).toEqual(mockTransactions);
    });

    it('should pass through undefined pagination parameters', async () => {
      // Act
      const result = await resolver.getTransactions(
        mockUser,
        undefined,
        undefined,
      );

      // Assert

      expect(mockWalletService.getTransactions).toHaveBeenCalledWith(
        mockUser,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction details by hash', async () => {
      // Arrange
      const hash =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      // Act
      const result = await resolver.getTransaction(hash);

      // Assert
      expect(mockWalletService.getTransactionByHash).toHaveBeenCalledWith(hash);
      expect(result).toEqual(mockAlchemyTransaction);
    });
  });
});
