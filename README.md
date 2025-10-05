## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

DATABASE - Mongo DB.

<!-- [API DOCS](https://documenter.getpostman.com/view/34965333/2sA3kRKjPc) API Postman Documentation - https://documenter.getpostman.com/view/34965333/2sA3kRKjPc) -->

[BASEURL](https://wallet-api-ylqb.onrender.com/graphql) - https://wallet-api-ylqb.onrender.com/graphql)

<p align="left">
  <img src="https://res.cloudinary.com/dcm3rb2us/image/upload/v1759707963/Screenshot_2025-10-05_at_10.33.32_PM_dbci8i.png" width="1000" title="hover text">
</p>
## DATABASE

Mongo DB.

## ENV

Create .env file

```
NODE_ENV=
PORT=
ACCESS_TOKEN_SECRET=""
JWT_EXPIRY=""
MONGO_URL=""
JWT_SECRET=hdbcbdcnejcedckdnxdhcxbhdbcdbchdbchchdjcdnjdjxdjxdxjdxkdxjdxd
THROTTLE_LIMIT=
THROTTLE_TTL=

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

## Installation

```bash
$ npm install --legacy-peer-deps
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

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
