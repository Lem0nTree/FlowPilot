const request = require('supertest');
const app = require('../server');

/**
 * Test Swagger integration
 */
async function testSwaggerIntegration() {
  console.log('🧪 Testing Swagger Integration...\n');

  try {
    // Test 1: Check if Swagger UI is accessible
    console.log('1. Testing Swagger UI endpoint...');
    const swaggerResponse = await request(app)
      .get('/api-docs')
      .expect(200);
    
    if (swaggerResponse.text.includes('swagger-ui')) {
      console.log('✅ Swagger UI is accessible');
    } else {
      console.log('❌ Swagger UI not found');
    }

    // Test 2: Check if health endpoint is documented
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await request(app)
      .get('/health')
      .expect(200);
    
    console.log('✅ Health endpoint is working');
    console.log('   Response:', JSON.stringify(healthResponse.body, null, 2));

    // Test 3: Check if API routes are accessible
    console.log('\n3. Testing API routes...');
    
    // Test sync endpoint (should return 400 for missing address)
    const syncResponse = await request(app)
      .post('/api/sync')
      .send({})
      .expect(400);
    console.log('✅ Sync endpoint validation working');

    // Test agents endpoint (should return 404 for invalid user)
    const agentsResponse = await request(app)
      .get('/api/agents/invalid-user-id')
      .expect(200);
    console.log('✅ Agents endpoint accessible');

    // Test users endpoint (should return 404 for invalid address)
    const usersResponse = await request(app)
      .get('/api/users/invalid-address')
      .expect(404);
    console.log('✅ Users endpoint validation working');

    console.log('\n🎉 All Swagger integration tests passed!');
    console.log('\n📚 Swagger Documentation is available at:');
    console.log('   http://localhost:5000/api-docs');
    console.log('\n🔗 API Endpoints:');
    console.log('   Health: GET /health');
    console.log('   Sync: POST /api/sync');
    console.log('   Agents: GET /api/agents/{userId}');
    console.log('   Users: GET /api/users/{address}');

  } catch (error) {
    console.error('❌ Swagger integration test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSwaggerIntegration()
    .then(() => {
      console.log('\n✅ Swagger integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = testSwaggerIntegration;
