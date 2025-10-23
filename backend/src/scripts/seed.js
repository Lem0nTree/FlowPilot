const prisma = require('../config/prisma');

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create sample users
    const users = [
      {
        address: '0x1234567890abcdef',
        nickname: 'TestUser1',
        email: 'test1@example.com'
      },
      {
        address: '0xfedcba0987654321',
        nickname: 'TestUser2',
        email: 'test2@example.com'
      }
    ];

    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { address: userData.address },
        update: userData,
        create: userData
      });
      console.log(`✅ Created/updated user: ${user.address}`);
    }

    // Create sample agents
    const agents = [
      {
        scheduledTxId: 'sched_tx_sample_1',
        ownerAddress: '0x1234567890abcdef',
        handlerContract: 'A.12345.DCABot',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        priority: 0,
        executionEffort: BigInt(1000),
        fees: '1000000',
        nickname: 'DCA Bot #1',
        description: 'Daily dollar cost averaging bot',
        tags: ['dca', 'trading', 'automated'],
        isActive: true
      },
      {
        scheduledTxId: 'sched_tx_sample_2',
        ownerAddress: '0x1234567890abcdef',
        handlerContract: 'A.67890.StakingRewardBot',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        priority: 1,
        executionEffort: BigInt(500),
        fees: '500000',
        nickname: 'Staking Rewards Collector',
        description: 'Automatically claims staking rewards',
        tags: ['staking', 'rewards', 'defi'],
        isActive: true
      }
    ];

    for (const agentData of agents) {
      const user = await prisma.user.findUnique({
        where: { address: agentData.ownerAddress }
      });

      if (user) {
        const agent = await prisma.agent.upsert({
          where: { scheduledTxId: agentData.scheduledTxId },
          update: { ...agentData, userId: user.id },
          create: { ...agentData, userId: user.id }
        });
        console.log(`✅ Created/updated agent: ${agent.scheduledTxId}`);
      }
    }

    // Create sample scan history
    const scanHistory = [
      {
        userAddress: '0x1234567890abcdef',
        agentsFound: 2,
        scanType: 'initial',
        success: true
      },
      {
        userAddress: '0xfedcba0987654321',
        agentsFound: 0,
        scanType: 'initial',
        success: true
      }
    ];

    for (const scanData of scanHistory) {
      await prisma.scanHistory.create({
        data: scanData
      });
      console.log(`✅ Created scan history for: ${scanData.userAddress}`);
    }

    console.log('🎉 Database seed completed successfully!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    // Prisma client is now managed centrally, no need to disconnect here
  }
}

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seed;
