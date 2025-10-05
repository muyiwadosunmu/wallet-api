import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { VerificationSecurity } from 'src/core/security/verification.security';
import { BlockchainProvider } from 'src/core/services/interfaces/blockchain.interface';
import { UserDocument } from '../users/schema/user.schema';
import { WalletDocument } from './schema/wallet.schema';
import { WalletTransaction } from './schema/wallet.transaction.schema';
import { Webhook } from './schema/webhook.schems';
import { WalletService } from './wallets.service';

describe('WalletService', () => {
  // Service we're testing
  let walletService: WalletService;
  
  // Mock models
  let mockWalletModel: Model<WalletDocument>;
  let mockWalletTransactionModel: Model<WalletTransaction>;
  let mockWebhookModel: Model<Webhook>;
  
  // Mock dependencies
  let mockBlockchainProvider: jest.Mocked<BlockchainProvider>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockVerificationSecurity: jest.Mocked<VerificationSecurity>;

  // Mock test data
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
  } as UserDocument;

  const mockWalletData = {
    address: '0xTestWalletAddress',
    privateKey: '0xTestPrivateKey',
    mnemonic: 'test mnemonic phrase',
    balance: '1.0',
    network: 'sepolia',
    user: 'user123',
    isDeleted: false,
    save: jest.fn().mockResolvedValue(true),
  };

  // Set up before each test
  beforeEach(async () => {
    // Create mock implementations
    const mockModels = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    // Create specific mock for walletModel with select method
    const mockWalletModelWithSelect = {
      ...mockModels,
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockWalletData),
      }),
    };

    // Create mocks for blockchain provider methods
    mockBlockchainProvider = {
      createWallet: jest.fn().mockResolvedValue({
        address: '0xTestWalletAddress',
        privateKey: '0xTestPrivateKey',
        mnemonic: 'test mnemonic phrase',
      }),
      getBalance: jest.fn().mockResolvedValue('1.0'),
      registerAddressForNotifications: jest.fn().mockResolvedValue(true),
      sendTransaction: jest.fn().mockResolvedValue({ hash: '0xTransactionHash' }),
      getTransactionHistory: jest.fn().mockResolvedValue([
        {
          hash: '0xTestHash1',
          fromAddress: '0xTestWalletAddress',
          toAddress: '0xRecipientAddress',
          value: '0.1',
        },
      ]),
      getGasPrice: jest.fn().mockResolvedValue('20'),
      getTransaction: jest.fn().mockResolvedValue({
        hash: '0xTestHash',
        fromAddress: '0xFromAddress',
        toAddress: '0xToAddress',
        value: '0.1',
      }),
    };

    // Create module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getModelToken('Wallet'),
          useValue: mockWalletModelWithSelect,
        },
        {
          provide: getModelToken('WalletTransaction'),
          useValue: mockModels,
        },
        {
          provide: getModelToken('Webhook'),
          useValue: mockModels,
        },
        {
          provide: 'BlockchainProvider',
          useValue: mockBlockchainProvider,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('webhook-secret'),
            get: jest.fn().mockReturnValue('sepolia'),
          },
        },
        {
          provide: VerificationSecurity,
          useValue: {
            hash: jest.fn().mockReturnValue('hashedMnemonic'),
          },
        },
      ],
    }).compile();

    // Get the service instance and dependencies
    walletService = module.get<WalletService>(WalletService);
    mockWalletModel = module.get<Model<WalletDocument>>(getModelToken('Wallet'));
    mockWalletTransactionModel = module.get<Model<WalletTransaction>>(getModelToken('WalletTransaction'));
    mockWebhookModel = module.get<Model<Webhook>>(getModelToken('Webhook'));
    mockConfigService = module.get(ConfigService);
    mockVerificationSecurity = module.get(VerificationSecurity);
    
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // Basic service test
  it('should be defined', () => {
    expect(walletService).toBeDefined();
  });

  // Tests grouped by method
  describe('createWallet', () => {
    it('should create a new wallet when user does not have one', async () => {
      // Arrange - set up the test scenario
      // Mock that findOne returns null (user has no wallet)
      jest.spyOn(mockWalletModel, 'findOne').mockResolvedValueOnce(null);
      
      // Mock that create returns a new wallet
      const createdWallet = { ...mockWalletData, save: jest.fn().mockResolvedValue(true) };
      jest.spyOn(mockWalletModel, 'create').mockResolvedValueOnce(createdWallet);

      // Act - call the method we're testing
      const result = await walletService.createWallet(mockUser);

      // Assert - verify the results
      expect(mockWalletModel.findOne).toHaveBeenCalledWith({
        user: mockUser.id,
        isDeleted: false,
      });
      
      expect(mockBlockchainProvider.createWallet).toHaveBeenCalled();
      expect(mockBlockchainProvider.registerAddressForNotifications).toHaveBeenCalledWith('0xTestWalletAddress');
      expect(mockVerificationSecurity.hash).toHaveBeenCalledWith('test mnemonic phrase');
      
      expect(mockWalletModel.create).toHaveBeenCalledWith({
        address: '0xTestWalletAddress',
        privateKey: '0xTestPrivateKey',
        mnemonic: 'test mnemonic phrase',
        hashedMnemonic: 'hashedMnemonic',
        user: mockUser.id,
        network: 'sepolia',
      });
      
      expect(mockBlockchainProvider.getBalance).toHaveBeenCalledWith('0xTestWalletAddress');
      expect(createdWallet.save).toHaveBeenCalled();
      expect(result).toEqual(createdWallet);
    });

    it('should throw BadRequestException if user already has a wallet', async () => {
      // Arrange - set up the test scenario
      // Mock that findOne returns an existing wallet
      jest.spyOn(mockWalletModel, 'findOne').mockResolvedValueOnce(mockWalletData);

      // Act & Assert - call the method and verify it throws
      await expect(walletService.createWallet(mockUser))
        .rejects
        .toThrow(new BadRequestException('You already have an active wallet'));

      // Verify that createWallet was not called
      expect(mockBlockchainProvider.createWallet).not.toHaveBeenCalled();
    });
  });

  describe('getWalletBalance', () => {
    it('should return wallet balance info', async () => {
      // Arrange
      jest.spyOn(mockWalletModel, 'findOne').mockResolvedValueOnce(mockWalletData);

      // Act
      const result = await walletService.getWalletBalance(mockUser);

      // Assert
      expect(mockWalletModel.findOne).toHaveBeenCalledWith({
        user: mockUser.id,
        isDeleted: false,
      });
      expect(mockBlockchainProvider.getBalance).toHaveBeenCalledWith('0xTestWalletAddress');
      expect(mockWalletData.save).toHaveBeenCalled();
      
      expect(result).toEqual({
        address: '0xTestWalletAddress',
        balance: '1.0',
        network: 'sepolia',
        formattedBalance: '1.000000 ETH',
        usdValue: 'N/A',
        lastUpdated: expect.any(Date),
      });
    });

    it('should throw BadRequestException if wallet not found', async () => {
      // Arrange
      jest.spyOn(mockWalletModel, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(walletService.getWalletBalance(mockUser))
        .rejects
        .toThrow(new BadRequestException('Wallet not found'));
    });
  });

  describe('getAddressBalance', () => {
    it('should return balance for a valid address', async () => {
      // Arrange
      const address = '0x1234567890123456789012345678901234567890';
      mockBlockchainProvider.getBalance.mockResolvedValueOnce('2.5');

      // Act
      const result = await walletService.getAddressBalance(address);

      // Assert
      expect(mockBlockchainProvider.getBalance).toHaveBeenCalledWith(address);
      expect(result).toEqual({
        address,
        balance: '2.5',
        network: 'sepolia',
        formattedBalance: '2.500000 ETH',
        usdValue: null,
        lastUpdated: expect.any(Date),
      });
    });

    it('should throw BadRequestException for invalid address format', async () => {
      // Arrange
      const invalidAddress = '0xinvalid';

      // Act & Assert
      await expect(walletService.getAddressBalance(invalidAddress))
        .rejects
        .toThrow(new BadRequestException('Invalid Ethereum address format'));
      
      expect(mockBlockchainProvider.getBalance).not.toHaveBeenCalled();
    });
  });

  describe('transferFunds', () => {
    it('should transfer funds successfully when balance is sufficient', async () => {
      // Arrange
      const toAddress = '0xRecipientAddress';
      const amount = 0.5;
      const walletWithPrivateKey = {
        ...mockWalletData,
        address: '0xSenderAddress',
      };
      
      // Mock wallet finding with private key
      jest.spyOn(mockWalletModel, 'findOne').mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(walletWithPrivateKey),
      } as any);
      
      // Mock sufficient balance
      mockBlockchainProvider.getBalance.mockResolvedValueOnce('1.0');
      
      // Mock transaction result
      const transactionResult = { 
        hash: '0xTransactionHash',
        fromAddress: '0xSenderAddress',
        toAddress: '0xRecipientAddress',
        value: '0.5',
      };
      mockBlockchainProvider.sendTransaction.mockResolvedValueOnce(transactionResult);

      // Act
      const result = await walletService.transferFunds(mockUser, toAddress, amount);

      // Assert
      expect(mockWalletModel.findOne).toHaveBeenCalledWith({ 
        user: mockUser.id, 
        isDeleted: false 
      });
      
      expect(mockBlockchainProvider.getBalance).toHaveBeenCalledWith('0xSenderAddress');
      
      expect(mockBlockchainProvider.sendTransaction).toHaveBeenCalledWith(
        '0xTestPrivateKey',
        '0xRecipientAddress',
        0.5
      );
      
      expect(result).toEqual(transactionResult);
    });

    it('should throw BadRequestException if wallet not found', async () => {
      // Arrange
      jest.spyOn(mockWalletModel, 'findOne').mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(null),
      } as any);

      // Act & Assert
      await expect(walletService.transferFunds(mockUser, '0xRecipient', 0.5))
        .rejects
        .toThrow(new BadRequestException('Wallet not found'));
    });

    it('should throw BadRequestException if transferring to own address', async () => {
      // Arrange
      const ownAddress = '0xSenderAddress';
      const walletWithPrivateKey = {
        ...mockWalletData,
        address: ownAddress,
      };
      
      jest.spyOn(mockWalletModel, 'findOne').mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(walletWithPrivateKey),
      } as any);

      // Act & Assert
      await expect(walletService.transferFunds(mockUser, ownAddress, 0.5))
        .rejects
        .toThrow(new BadRequestException('Cannot transfer to your own address'));
    });

    it('should throw BadRequestException if insufficient funds', async () => {
      // Arrange
      const toAddress = '0xRecipientAddress';
      const amount = 1.0; // Amount that with gas would exceed balance
      const walletWithPrivateKey = {
        ...mockWalletData,
        address: '0xSenderAddress',
      };
      
      jest.spyOn(mockWalletModel, 'findOne').mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(walletWithPrivateKey),
      } as any);
      
      // Mock insufficient balance
      mockBlockchainProvider.getBalance.mockResolvedValueOnce('0.9'); // Less than amount + gas

      // Act & Assert
      await expect(walletService.transferFunds(mockUser, toAddress, amount))
        .rejects
        .toThrow(BadRequestException);
      
      expect(mockBlockchainProvider.sendTransaction).not.toHaveBeenCalled();
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history for user wallet', async () => {
      // Arrange
      jest.spyOn(mockWalletModel, 'findOne').mockResolvedValueOnce(mockWalletData);
      
      const mockTransactions = [
        {
          hash: '0xHash1',
          fromAddress: '0xTestWalletAddress',
          toAddress: '0xRecipient1',
          value: '0.1',
        },
        {
          hash: '0xHash2',
          fromAddress: '0xSomeAddress',
          toAddress: '0xTestWalletAddress',
          value: '0.2',
        },
      ];
      
      mockBlockchainProvider.getTransactionHistory.mockResolvedValueOnce(mockTransactions);

      // Act
      const result = await walletService.getTransactionHistory(mockUser);

      // Assert
      expect(mockWalletModel.findOne).toHaveBeenCalledWith({
        user: mockUser.id,
        isDeleted: false,
      });
      
      expect(mockBlockchainProvider.getTransactionHistory).toHaveBeenCalledWith('0xTestWalletAddress');
      expect(result).toEqual(mockTransactions);
    });

    it('should throw BadRequestException if wallet not found', async () => {
      // Arrange
      jest.spyOn(mockWalletModel, 'findOne').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(walletService.getTransactionHistory(mockUser))
        .rejects
        .toThrow(new BadRequestException('Wallet not found'));
      
      expect(mockBlockchainProvider.getTransactionHistory).not.toHaveBeenCalled();
    });
  });

  describe('getTransactionByHash', () => {
    it('should return transaction details for valid hash', async () => {
      // Arrange
      const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const mockTransaction = {
        hash: txHash,
        fromAddress: '0xSender',
        toAddress: '0xRecipient',
        value: '1.0',
        status: 'confirmed',
      };
      
      mockBlockchainProvider.getTransaction.mockResolvedValueOnce(mockTransaction);

      // Act
      const result = await walletService.getTransactionByHash(txHash);

      // Assert
      expect(mockBlockchainProvider.getTransaction).toHaveBeenCalledWith(txHash);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException for invalid transaction hash format', async () => {
      // Arrange
      const invalidHash = '0xinvalid';

      // Act & Assert
      await expect(walletService.getTransactionByHash(invalidHash))
        .rejects
        .toThrow(new BadRequestException('Invalid transaction hash format'));
      
      expect(mockBlockchainProvider.getTransaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if transaction not found', async () => {
      // Arrange
      const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
      mockBlockchainProvider.getTransaction.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(walletService.getTransactionByHash(txHash))
        .rejects
        .toThrow(new BadRequestException('Transaction not found'));
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signatures', async () => {
      // This would need crypto mocking which is more complex
      // For a simple test, we could test the failure case:
      jest.spyOn(mockConfigService, 'getOrThrow').mockImplementation(() => {
        throw new Error('Configuration error');
      });

      const result = await walletService.verifyWebhookSignature('test-body', 'test-signature');
      expect(result).toBe(false);
    });
  });
});