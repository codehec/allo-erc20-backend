export const blockchainConfig = {
  wssUrl: process.env.BLOCKCHAIN_WSS_URL || 'wss://bsc-testnet.drpc.org',
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '5'),
  retryDelay: parseInt(process.env.RETRY_DELAY || '1000'),
  connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '30000'),
  confirmationsRequired: parseInt(process.env.CONFIRMATIONS_REQUIRED || '6'),

  batchSize: parseInt(process.env.BATCH_SIZE || '10'),
  batchInterval: parseInt(process.env.BATCH_INTERVAL || '2000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '100'),
}; 