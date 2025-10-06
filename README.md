
# Wallet API -  Wallet Management System

## Description

A robust GraphQL API for managing Ethereum wallets, supporting wallet creation, balance queries, transaction history, and fund transfers. Built with NestJS, Apollo GraphQL, MongoDB, and integrated with blockchain services.

[BASEURL](https://wallet-api-ylqb.onrender.com/graphql) - https://wallet-api-ylqb.onrender.com/graphql

<p align="left">
  <img src="https://res.cloudinary.com/dcm3rb2us/image/upload/v1759707963/Screenshot_2025-10-05_at_10.33.32_PM_dbci8i.png" width="1000" title="Wallet API GraphQL Playground">
</p>

## Technology Stack & Architecture

### Backend Engineering Skills

- **NestJS Framework**: Chosen for its modular architecture, TypeScript integration, and built-in support for dependency injection
- **Apollo GraphQL**: Implemented a robust GraphQL API with resolvers, schemas, and proper error handling
- **MongoDB**: Utilized for database operations with Mongoose for schema validation and data modeling
- **TypeScript**: Employed throughout the application for type safety, better IDE support, and reduced runtime errors

### Integration Capabilities

- **Alchemy SDK**: Integrated for wallet creation and balance checks
- **Etherscan API**: Implemented as a fallback solution for fetching transaction history due to limitations encountered with Alchemy's transaction API
- **External API Integration Pattern**: Created provider interfaces and implementations that can be swapped based on configuration

### Code Quality

- **Modular Architecture**: Organized codebase with clear separation of concerns (core, modules, graphql)
- **Error Handling**: Comprehensive error catching and custom error responses
- **Configuration Management**: Environment-based configuration with proper validation
- **Code Documentation**: Clear comments and well-structured code for maintainability

### Database

MongoDB was chosen for:
- Flexible schema design for blockchain data

## Testing & Security Practices

### Testing Strategy

- **Unit Testing**: Comprehensive test coverage for resolvers and services using Jest
- **Mock Implementation**: Used Jest mocking capabilities to isolate units for proper testing
- **Test Coverage Reports**: Configured to track code coverage and identify untested areas
- **Test-Driven Development**: Implemented tests alongside code development to ensure feature correctness

### Security Measures

- **JWT Authentication**: Secure user authentication with JWT tokens
- **GraphQL Protection**: Implemented custom decorators for route protection
- **Rate Limiting**: Implemented to prevent abuse of API endpoints

## DevOps & Deployment

- **Environment Management**: Clear separation between development, staging, and production environments
- **Branch Strategy**: 
  - `main` branch for local development and testing
  - `staging` branch for deployment to staging environment
  - Clear separation of concerns between environments
- **Deployment**: Application deployed on Render for easy scaling and management

## API Integration Notes

### Blockchain Service Integration

**Alchemy vs Etherscan Decision**:
- Initially integrated with Alchemy SDK for all blockchain operations
- Encountered limitations with Alchemy's transaction history API for specific use cases
- Implemented Etherscan as a fallback solution for transaction history due to its more comprehensive transaction data
- Created a provider interface pattern that allows easy switching between providers based on configuration

## Environment Variables

Create .env file with the following variables:

```
NODE_ENV=
PORT=
ACCESS_TOKEN_SECRET=""
JWT_EXPIRY=""
MONGO_URL=""
JWT_SECRET=""
THROTTLE_LIMIT=
THROTTLE_TTL=

# Blockchain API Keys
ALCHEMY_API_KEY=
ETH_NETWORK=
SEPOLIA_TESTNET_URL=
ETHERSCAN_BASE_URL=""
ETHERSCAN_API_KEY=""
SEPOLIA_CHAIN_ID=""
ALCHEMY_WEBHOOK_ID=""
ALCHEMY_AUTH_TOKEN=""
ALCHEMY_WEBHOOK_SIGNING_KEY=""
```

## Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application entry point
├── core/                      # Core functionality
│   ├── constant/              # Application constants
│   ├── database/              # Database configuration
│   ├── decorators/            # Custom decorators for GraphQL
│   ├── error/                 # Error handling
│   ├── guard/                 # Authentication guards
│   ├── helper/                # Utility functions
│   ├── security/              # Security related code
│   ├── services/              # External service integrations
│   │   ├── alchemy/           # Alchemy blockchain provider
│   │   ├── etherscan/         # Etherscan blockchain provider
│   │   └── interfaces/        # Service interfaces
│   └── validation/            # Validation rules
├── graphql/                   # GraphQL specific code
│   └── dtos/                  # Data Transfer Objects
└── modules/                   # Feature modules
    └── v1/                    # API version 1
        ├── auth/              # Authentication
        ├── users/             # User management
        └── wallets/           # Wallet operations
```

## Installation

```bash
# Clone the repository
$ git clone https://github.com/muyiwadosunmu/wallet-api.git

# Change directory
$ cd wallet-api

# Install dependencies
$ npm install --legacy-peer-deps

# Create .env file from example
$ cp .env.example .env
# Then edit .env file with your configuration
```

## Running the Application

```bash
# Development mode
$ npm run start

# Watch mode for development
$ npm run start:dev

# Production mode
$ npm run start:prod
```

After starting the application, the GraphQL playground will be available at `http://localhost:3000/graphql`

## API Features

- **Basic User Authentication**: Register and login with JWT-based authentication
- **Wallet Management**: Create and manage Ethereum wallets
- **Balance Checking**: Query wallet balances in real-time from the blockchain
- **Transaction History**: View transaction history for wallets
- **Fund Transfers**: Send ETH between wallets with transaction confirmation

## Running Tests

```bash
# Run all tests
$ npm test

# Run all tests with watch mode
$ npm run test:watch

# Run all tests with coverage reports
$ npm run test:cov

# Run tests for a specific file
$ npm run test:file src/path/to/your/file.spec.ts

# Run tests for a specific file with coverage
$ npm run test:file src/path/to/your/file.spec.ts -- --coverage
```

The coverage report will be generated in the `coverage` directory. For individual file coverage, 
only the specific file being tested will be included in the coverage report.

## Project Decisions and Trade-offs

1. **NestJS Framework**: Chosen for its structured approach to building scalable server-side applications with TypeScript support. The modular architecture allows for easy maintenance and extension.

3. **MongoDB**: Offers flexible schema design that works well with blockchain data which can have varying structures.

4. **Multiple Blockchain Providers**: Implemented both Alchemy and Etherscan integrations to leverage strengths of each:
   - Alchemy for wallet creation and balance operations
   - Etherscan for comprehensive transaction history

5. **Testing Strategy**: Focused on unit testing resolvers and services with high coverage to ensure reliability of core functionality.

6. **Deployment Strategy**: Separated development (main branch) from staging deployment to ensure stable testing environments.

