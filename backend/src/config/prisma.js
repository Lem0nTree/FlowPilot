const { PrismaClient } = require('@prisma/client');

// Determine which database URL to use based on FLOW_NETWORK
const flowNetwork = process.env.FLOW_NETWORK || (process.env.NODE_ENV === 'testnet' ? 'testnet' : 'mainnet');
const databaseUrl = flowNetwork === 'mainnet' 
  ? process.env.DATABASE_URL_MAINNET || process.env.DATABASE_URL
  : process.env.DATABASE_URL;

// Validate database URL
if (!databaseUrl) {
  throw new Error(`Database URL not configured for ${flowNetwork}. Please set DATABASE_URL_${flowNetwork.toUpperCase()} or DATABASE_URL`);
}

console.log(`🗄️  Using database for ${flowNetwork.toUpperCase()}`);

// Create PrismaClient with explicit datasource override
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
