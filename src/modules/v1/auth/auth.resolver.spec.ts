import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { RegisterInput, LoginInput } from './dto/auth.input';
import {
  UserDto,
  CreatedUserDto,
  LoggedInUserDto,
} from 'src/graphql/dtos/user.dto';

// Mock the decorators that might cause import issues
jest.mock('src/core/decorators/access.decorator', () => ({
  GqlProtected: () => jest.fn(),
}));

jest.mock('src/core/decorators/logged-in-decorator', () => ({
  LoggedInGqlUser: () => jest.fn(),
}));

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  // Create mock data
  const mockUser: UserDto = {
    id: '123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    suspended: false,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreatedUser: CreatedUserDto = {
    id: '123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockLoggedInUser: LoggedInUserDto = {
    id: '123',
    token: 'test-token',
  };

  // Create mock service
  const mockAuthService = {
    registerUser: jest.fn().mockResolvedValue(mockCreatedUser),
    login: jest.fn().mockResolvedValue(mockLoggedInUser),
    getUserById: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    // Reset mocks between tests
    jest.clearAllMocks();

    // Create a test module for each test
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('me', () => {
    it('should return the current user', async () => {
      // Act
      const result = await resolver.me(mockUser);

      // Assert
      expect(result).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Arrange
      const registerInput: RegisterInput = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Act
      const result = await resolver.register(registerInput);

      // Assert
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(registerInput);
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('login', () => {
    it('should login a user and return token', async () => {
      // Arrange
      const loginInput: LoginInput = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      // Act
      const result = await resolver.login(loginInput);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginInput);
      expect(result).toEqual(mockLoggedInUser);
    });
  });
});
