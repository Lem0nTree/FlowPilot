const prisma = require('../config/prisma');

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in database`);
    
    // Test agent count
    const agentCount = await prisma.agent.count();
    console.log(`🤖 Found ${agentCount} agents in database`);
    
    // Test scan history count
    const scanCount = await prisma.scanHistory.count();
    console.log(`📈 Found ${scanCount} scan history records`);
    
    console.log('🎉 All database operations successful!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('✅ Connection test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Connection test failed:', error);
      process.exit(1);
    });
}

module.exports = testConnection;
