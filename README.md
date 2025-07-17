<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository with Web3 blockchain integration.

## Blockchain Configuration

This project includes a Web3Service that connects to blockchain networks via WebSocket (WSS) with automatic retry logic.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
BLOCKCHAIN_WSS_URL=wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID
RETRY_ATTEMPTS=5
RETRY_DELAY=1000
CONNECTION_TIMEOUT=30000
CONFIRMATIONS_REQUIRED=6
BATCH_SIZE=10
BATCH_INTERVAL=5000
MAX_RETRIES=100
```

### Web3Service Features

- **WSS Connection**: Connects to blockchain via WebSocket
- **Automatic Retry**: Retries connection on failure with configurable attempts
- **Connection Monitoring**: Monitors connection status and automatically reconnects
- **Graceful Shutdown**: Properly disconnects on application shutdown
- **Batch Processing**: Processes pending transactions in configurable batches
- **Event Subscription**: Subscribes to contract events with confirmation tracking
- **Pending Event Management**: Tracks and processes events waiting for confirmations
- **ABI Event Processing**: Automatically decodes events using contract ABI from configuration
- **Dynamic Topic Generation**: Generates event topics from ABI instead of hardcoding

### API Endpoints

#### Connection Management
- `POST /web3/connect` - Manually connect to blockchain and get current block number
- `GET /web3/status` - Check connection status
- `POST /web3/disconnect` - Disconnect from blockchain

#### Event Management
- `GET /web3/test-subscription` - Test event subscription and get pending events count
- `GET /web3/pending-events` - Get all pending events with details
- `GET /web3/event-topics` - Get all available event topics from ABI
- `POST /web3/test-abi` - Test ABI decoding and display available events

### Auto-Connection

The server automatically connects to the blockchain network when it starts up. The connection is established before the HTTP server begins listening for requests.

### Batch Processing Configuration

The Web3Service includes a sophisticated batch processing system for handling pending blockchain events:

- **Batch Size**: Number of transactions processed in each batch (default: 10)
- **Batch Interval**: Time between batch processing cycles in milliseconds (default: 5000ms)
- **Max Retries**: Maximum number of retry attempts for pending events (default: 100)
- **Confirmations Required**: Number of block confirmations required before processing events (default: 6)

The batch processing system automatically:
- Tracks pending events in an array
- Processes events in configurable batches
- Removes confirmed events from the pending array
- Provides real-time statistics and monitoring
- Allows manual batch triggering for immediate processing

### ABI Event Processing

The Web3Service now includes sophisticated ABI-based event processing:

- **Dynamic Event Detection**: Automatically detects all events from the contract ABI
- **Topic Generation**: Generates event topics dynamically from ABI signatures
- **Event Decoding**: Decodes both indexed and non-indexed event parameters
- **Type Conversion**: Properly converts address and numeric types
- **Error Handling**: Graceful handling of decoding errors with detailed logging

## Project setup

```bash
$ npm install
```

```bash
$ npm run start:dev
```
To test out endpoints

Get Recent Events (with contract address in path)
```bash
curl -X GET "http://localhost:3000/web3/events/recent/0x31Fa545A6A0E4bBE7b39C6b3f8D1BcFD6546ED10"
```
Get Token Balance
```bash
curl -X GET "http://localhost:3000/web3/token/balance/0x31Fa545A6A0E4bBE7b39C6b3f8D1BcFD6546ED10/0x293127Fa5a8F97A4C3802782a37538A6a7A956D4"
```
WebSocket Status
```bash
curl -X GET http://localhost:3000/websocket/status
```
WebSocket Subscriptions
```bash
curl -X GET http://localhost:3000/websocket/subscriptions
```
WebSocket Info
```bash
curl -X GET http://localhost:3000/websocket/info
```
## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
