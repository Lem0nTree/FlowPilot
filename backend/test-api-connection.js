require('dotenv').config();
const axios = require('axios');

console.log('=== FindLabs API Connection Test ===\n');

// Check environment configuration
const isTestnet = process.env.NODE_ENV === 'testnet';
const apiUrl = isTestnet 
  ? process.env.FIND_LABS_API_BASE_TESTNET 
  : process.env.FIND_LABS_API_BASE_MAINNET;

console.log('Configuration:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  Network: ${isTestnet ? 'TESTNET' : 'MAINNET'}`);
console.log(`  API URL: ${apiUrl}`);
console.log(`  Username: ${process.env.FIND_LABS_USERNAME}`);
console.log(`  Password: ${process.env.FIND_LABS_PASSWORD ? '***' : 'NOT SET'}\n`);

if (!apiUrl) {
  console.error('❌ ERROR: API URL not configured!');
  console.error('   Please set FIND_LABS_API_BASE_TESTNET or FIND_LABS_API_BASE_MAINNET in .env');
  process.exit(1);
}

if (!process.env.FIND_LABS_USERNAME || !process.env.FIND_LABS_PASSWORD) {
  console.error('❌ ERROR: API credentials not configured!');
  console.error('   Please set FIND_LABS_USERNAME and FIND_LABS_PASSWORD in .env');
  process.exit(1);
}

const client = axios.create({
  baseURL: apiUrl,
  auth: {
    username: process.env.FIND_LABS_USERNAME,
    password: process.env.FIND_LABS_PASSWORD
  },
  timeout: 30000
});

async function testConnection() {
  try {
    console.log('Testing API connection...\n');
    
    // Test with the user's address
    const testAddress = '0x6cc67be8d78c0bd1';
    const response = await client.get('/flow/v1/scheduled-transaction', {
      params: {
        owner: testAddress,
        limit: 5
      }
    });

    console.log('✅ API connection successful!\n');
    console.log(`Results for address: ${testAddress}`);
    console.log(`  Total transactions found: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      console.log('\nSample transactions:');
      response.data.data.slice(0, 3).forEach((tx, i) => {
        console.log(`  ${i + 1}. ID: ${tx.id}`);
        console.log(`     Status: ${tx.status}`);
        console.log(`     Handler UUID: ${tx.handler_uuid}`);
        console.log(`     Scheduled: ${tx.scheduled_at}`);
        console.log('');
      });

      // Group by handler_uuid
      const handlerGroups = {};
      response.data.data.forEach(tx => {
        const uuid = tx.handler_uuid?.toString();
        if (!uuid) return;
        if (!handlerGroups[uuid]) {
          handlerGroups[uuid] = [];
        }
        handlerGroups[uuid].push(tx);
      });

      console.log('Agents found (grouped by handler_uuid):');
      Object.entries(handlerGroups).forEach(([uuid, txs]) => {
        const scheduled = txs.find(tx => tx.status === 'scheduled');
        const completed = txs.filter(tx => tx.is_completed);
        console.log(`  Handler UUID: ${uuid}`);
        console.log(`    Current scheduled: ${scheduled ? scheduled.id : 'None'}`);
        console.log(`    Completed executions: ${completed.length}`);
        console.log('');
      });

      console.log('✅ Backend should be able to fetch and process these transactions!');
    } else {
      console.log('⚠️  No transactions found for this address');
      console.log('   This might be normal if the address has no scheduled transactions');
    }

  } catch (error) {
    console.error('❌ API connection failed!\n');
    
    if (error.response) {
      console.error('HTTP Error Response:');
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${error.response.statusText}`);
      
      if (error.response.status === 401) {
        console.error('\n⚠️  Authentication failed!');
        console.error('   Check your FIND_LABS_USERNAME and FIND_LABS_PASSWORD in .env');
      } else if (error.response.status === 404) {
        console.error('\n⚠️  API endpoint not found!');
        console.error('   Check your API URL configuration');
      }
      
      if (error.response.data) {
        console.error('  Response data:', error.response.data);
      }
    } else if (error.request) {
      console.error('No response received from server');
      console.error('  Error:', error.message);
      console.error('\n⚠️  Network issue or API server not responding');
      console.error('   Check your internet connection and firewall settings');
    } else {
      console.error('Request setup error:', error.message);
    }
    
    process.exit(1);
  }
}

testConnection();

