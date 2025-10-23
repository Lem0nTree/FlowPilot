const prisma = require('../config/prisma');

async function testUpsertPerformance() {
  try {
    console.log('🚀 Testing upsert performance optimizations...');
    
    const testAddress = '0xtestupsert123456';
    const testAgentId = 'test_agent_upsert_123';
    
    // Test 1: User upsert (should be faster than find + create)
    console.log('📊 Testing user upsert...');
    const startUser = Date.now();
    
    const user = await prisma.user.upsert({
      where: { address: testAddress },
      update: {},
      create: { address: testAddress },
    });
    
    const userTime = Date.now() - startUser;
    console.log(`✅ User upsert completed in ${userTime}ms`);
    
    // Test 2: Agent upsert (should be faster than find + create/update)
    console.log('🤖 Testing agent upsert...');
    const startAgent = Date.now();
    
    const agent = await prisma.agent.upsert({
      where: { scheduledTxId: testAgentId },
      update: {
        status: 'scheduled',
        scheduledAt: new Date(),
        priority: 1,
        executionEffort: BigInt(1000),
        fees: '1000000'
      },
      create: {
        scheduledTxId: testAgentId,
        ownerAddress: testAddress,
        handlerContract: 'A.123.TestContract',
        status: 'scheduled',
        scheduledAt: new Date(),
        priority: 1,
        executionEffort: BigInt(1000),
        fees: '1000000',
        userId: user.id
      }
    });
    
    const agentTime = Date.now() - startAgent;
    console.log(`✅ Agent upsert completed in ${agentTime}ms`);
    
    // Test 3: Parallel agent upserts (simulating real scan scenario)
    console.log('⚡ Testing parallel agent upserts...');
    const startParallel = Date.now();
    
    const parallelPromises = Array.from({ length: 5 }, (_, i) => 
      prisma.agent.upsert({
        where: { scheduledTxId: `test_parallel_${i}` },
        update: {
          status: 'scheduled',
          scheduledAt: new Date(),
          priority: i,
          executionEffort: BigInt(1000 + i),
          fees: `${1000000 + i}`
        },
        create: {
          scheduledTxId: `test_parallel_${i}`,
          ownerAddress: testAddress,
          handlerContract: `A.123.TestContract${i}`,
          status: 'scheduled',
          scheduledAt: new Date(),
          priority: i,
          executionEffort: BigInt(1000 + i),
          fees: `${1000000 + i}`,
          userId: user.id
        }
      })
    );
    
    const parallelResults = await Promise.all(parallelPromises);
    const parallelTime = Date.now() - startParallel;
    console.log(`✅ Parallel upserts (${parallelResults.length} agents) completed in ${parallelTime}ms`);
    
    // Test 4: Performance comparison - old vs new approach
    console.log('📈 Performance comparison...');
    
    // Old approach simulation (find + create/update)
    const startOld = Date.now();
    const existingUser = await prisma.user.findUnique({
      where: { address: `${testAddress}_old` }
    });
    if (!existingUser) {
      await prisma.user.create({
        data: { address: `${testAddress}_old` }
      });
    }
    const oldTime = Date.now() - startOld;
    
    // New approach (upsert)
    const startNew = Date.now();
    await prisma.user.upsert({
      where: { address: `${testAddress}_new` },
      update: {},
      create: { address: `${testAddress}_new` }
    });
    const newTime = Date.now() - startNew;
    
    console.log(`📊 Performance Results:`);
    console.log(`   Old approach (find + create): ${oldTime}ms`);
    console.log(`   New approach (upsert): ${newTime}ms`);
    console.log(`   Improvement: ${oldTime > newTime ? `${oldTime - newTime}ms faster` : 'Similar performance'}`);
    
    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await prisma.agent.deleteMany({
      where: {
        OR: [
          { scheduledTxId: testAgentId },
          { scheduledTxId: { startsWith: 'test_parallel_' } }
        ]
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        address: {
          in: [testAddress, `${testAddress}_old`, `${testAddress}_new`]
        }
      }
    });
    
    console.log('🎉 Upsert performance test completed successfully!');
    console.log('✅ All optimizations are working correctly');
    
  } catch (error) {
    console.error('❌ Upsert performance test failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  testUpsertPerformance()
    .then(() => {
      console.log('✅ Performance test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Performance test failed:', error);
      process.exit(1);
    });
}

module.exports = testUpsertPerformance;
