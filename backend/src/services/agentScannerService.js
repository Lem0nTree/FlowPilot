const axios = require('axios');

class AgentScannerService {
  constructor() {
    this.apiUrl = process.env.FIND_LABS_API_URL || 'https://api.find.xyz';
    this.username = process.env.FIND_LABS_USERNAME;
    this.password = process.env.FIND_LABS_PASSWORD;
    
    if (!this.username || !this.password) {
      throw new Error('Find Labs API credentials not configured');
    }

    // Create axios instance with basic auth
    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      auth: {
        username: this.username,
        password: this.password
      },
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FlowPilot-Backend/1.0.0'
      }
    });
  }

  /**
   * Scan for active agents using Find Labs API
   * @param {string} userAddress - Flow address to scan
   * @returns {Promise<Object>} - Scan results
   */
  async scanForAgents(userAddress) {
    try {
      console.log(`🔍 Scanning for agents for address: ${userAddress}`);
      
      const activeAgents = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await this.apiClient.get('/flow/v1/scheduled-transaction', {
          params: {
            owner: userAddress,
            is_completed: false,
            limit: limit,
            offset: offset
          }
        });

        const agents = response.data.data || [];
        
        // Filter for scheduled status
        const scheduledAgents = agents.filter(agent => 
          agent.status === 'scheduled' || agent.status === 'pending'
        );

        activeAgents.push(...scheduledAgents);

        // Check if there are more results
        hasMore = agents.length === limit;
        offset += limit;

        // Safety break to prevent infinite loops
        if (offset > 1000) {
          console.warn('⚠️  Reached maximum pagination limit (1000 records)');
          break;
        }
      }

      console.log(`✅ Found ${activeAgents.length} active agents for ${userAddress}`);

      return {
        success: true,
        activeAgents: activeAgents.map(agent => this.mapAgentData(agent)),
        totalFound: activeAgents.length,
        scannedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error scanning for agents:', error.message);
      
      if (error.response) {
        // API returned an error response
        throw new Error(`Find Labs API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Find Labs API is not responding');
      } else {
        // Something else happened
        throw new Error(`Scan failed: ${error.message}`);
      }
    }
  }

  /**
   * Map Find Labs API response to our internal format
   * @param {Object} agent - Agent data from API
   * @returns {Object} - Mapped agent data
   */
  mapAgentData(agent) {
    return {
      scheduledTxId: agent.id,
      ownerAddress: agent.owner,
      handlerContract: agent.handler_contract,
      status: agent.status,
      scheduledAt: agent.scheduled_at,
      priority: agent.priority,
      executionEffort: agent.execution_effort,
      fees: agent.fees?.toString(),
      createdAt: agent.created_at,
      updatedAt: agent.updated_at
    };
  }

  /**
   * Get detailed information about a specific agent
   * @param {string} scheduledTxId - Scheduled transaction ID
   * @returns {Promise<Object>} - Agent details
   */
  async getAgentDetails(scheduledTxId) {
    try {
      const response = await this.apiClient.get(`/flow/v1/scheduled-transaction/${scheduledTxId}`);
      return {
        success: true,
        agent: this.mapAgentData(response.data)
      };
    } catch (error) {
      console.error('❌ Error getting agent details:', error.message);
      throw new Error(`Failed to get agent details: ${error.message}`);
    }
  }

  /**
   * Test API connectivity
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      const response = await this.apiClient.get('/flow/v1/scheduled-transaction', {
        params: { limit: 1 }
      });
      return true;
    } catch (error) {
      console.error('❌ API connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = AgentScannerService;
