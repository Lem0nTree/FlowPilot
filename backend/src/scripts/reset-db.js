const prisma = require('../config/prisma');
const { execSync } = require('child_process');
const path = require('path');

async function resetDatabase() {
  console.log('🔄 Starting database reset...');

  try {
    // Step 1: Delete all data from all collections
    console.log('🗑️  Deleting all data from collections...');
    
    try {
      // Delete in order to respect foreign key constraints (CASCADE behavior)
      await prisma.agentExecution.deleteMany({});
      console.log('  ✅ Deleted all AgentExecution records');
      
      await prisma.agent.deleteMany({});
      console.log('  ✅ Deleted all Agent records');
      
      await prisma.scanHistory.deleteMany({});
      console.log('  ✅ Deleted all ScanHistory records');
      
      await prisma.user.deleteMany({});
      console.log('  ✅ Deleted all User records');
    } catch (error) {
      console.log(`  ⚠️  Error deleting data (might be empty): ${error.message}`);
    }

    // Step 2: Push schema to recreate collections
    console.log('\n🔨 Pushing Prisma schema to recreate collections...');
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit',
        env: process.env
      });
      console.log('  ✅ Schema pushed successfully');
    } catch (error) {
      console.error('  ❌ Failed to push schema:', error.message);
      throw error;
    }

    // Step 3: Generate Prisma Client
    console.log('\n🔧 Generating Prisma Client...');
    try {
      execSync('npx prisma generate', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit',
        env: process.env
      });
      console.log('  ✅ Prisma Client generated');
    } catch (error) {
      console.error('  ❌ Failed to generate Prisma Client:', error.message);
      throw error;
    }

    // Step 4: Seed database
    console.log('\n🌱 Seeding database...');
    try {
      const seed = require('./seed');
      await seed();
      console.log('  ✅ Database seeded successfully');
    } catch (error) {
      console.error('  ❌ Failed to seed database:', error.message);
      throw error;
    }

    console.log('\n🎉 Database reset completed successfully!');

  } catch (error) {
    console.error('\n❌ Database reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  resetDatabase()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = resetDatabase;

