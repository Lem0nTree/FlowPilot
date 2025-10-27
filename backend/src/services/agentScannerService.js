const axios = require('axios');

class AgentScannerService {
  constructor() {
    // Dynamically choose the API URL based on the environment
    const isTestnet = process.env.NODE_ENV === 'testnet';
    this.apiUrl = isTestnet 
      ? process.env.FIND_LABS_API_BASE_TESTNET 
      : process.env.FIND_LABS_API_BASE_MAINNET;

    // It's great practice to log which environment you're using on startup
    console.log(`🚀 AgentScannerService initialized for ${isTestnet ? 'TESTNET' : 'MAINNET'}`);
    console.log(`--> Using API endpoint: ${this.apiUrl}`);
    
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
   * Scan for ALL transactions (scheduled + completed) using Find Labs API
   * @param {string} userAddress - Flow address to scan
   * @returns {Promise<Object>} - Scan results with execution chains
   */
  async scanForAgents(userAddress) {
    try {
      console.log(`🔍 Scanning for all transactions for address: ${userAddress}`);
      
      const allTransactions = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      // Fetch ALL transactions (no status filter)
      while (hasMore) {
        const response = await this.apiClient.get('/flow/v1/scheduled-transaction', {
          params: {
            owner: userAddress,
            // Removed is_completed filter to get ALL transactions
            limit: limit,
            offset: offset
          }
        });

        const transactions = response.data.data || [];
        allTransactions.push(...transactions);

        // Check if there are more results
        hasMore = transactions.length === limit;
        offset += limit;

        // Safety break to prevent infinite loops
        if (offset > 1000) {
          console.warn('⚠️  Reached maximum pagination limit (1000 records)');
          break;
        }
      }

      console.log(`✅ Found ${allTransactions.length} total transactions for ${userAddress}`);

      // Build execution chains
      const { activeAgents, executionData } = this.buildExecutionChains(allTransactions);

      console.log(`✅ Identified ${activeAgents.length} active agents with execution history`);

      return {
        success: true,
        activeAgents: activeAgents,
        allTransactions: allTransactions.map(tx => this.mapAgentData(tx)),
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
   * Build execution chains from all transactions
   * Groups transactions by handler_uuid and traces execution history
   * @param {Array} transactions - All transactions from API
   * @returns {Object} - Active agents with execution chains
   */
  buildExecutionChains(transactions) {
    // Group transactions by handler_uuid
    const handlerGroups = {};
    
    transactions.forEach(tx => {
      const uuid = tx.handler_uuid;
      if (!uuid) return;
      
      if (!handlerGroups[uuid]) {
        handlerGroups[uuid] = [];
      }
      handlerGroups[uuid].push(tx);
    });

    const activeAgents = [];

    // Process each handler group
    Object.entries(handlerGroups).forEach(([uuid, txList]) => {
      // Find the current scheduled transaction (this is the "active" agent)
      const scheduledTx = txList.find(tx => tx.status === 'scheduled');
      
      if (!scheduledTx) {
        // No scheduled transaction means this agent is no longer active
        return;
      }

      // Build execution chain by walking backwards through completed transactions
      const executionChain = [];
      const txMap = new Map(txList.map(tx => [tx.scheduled_transaction, tx]));
      
      let successCount = 0;
      let failedCount = 0;
      let lastExecutionDate = null;

      // Walk the chain backwards from most recent completed transactions
      txList.forEach(tx => {
        if (tx.is_completed && tx.status !== 'scheduled') {
          executionChain.push({
            scheduledTxId: tx.id,
            completedTxId: tx.completed_transaction,
            status: tx.status,
            scheduledAt: tx.scheduled_at,
            completedAt: tx.completed_at,
            blockHeight: tx.block_height,
            completedBlockHeight: tx.completed_block_height,
            fees: tx.fees,
            executionEffort: tx.execution_effort,
            error: tx.error
          });

          if (tx.status === 'executed') {
            successCount++;
          } else if (tx.status === 'failed') {
            failedCount++;
          }

          // Track most recent execution
          if (tx.completed_at) {
            const completedDate = new Date(tx.completed_at);
            if (!lastExecutionDate || completedDate > lastExecutionDate) {
              lastExecutionDate = completedDate;
            }
          }
        }
      });

      // Sort execution chain by completion time (most recent first)
      executionChain.sort((a, b) => {
        const dateA = new Date(a.completedAt || 0);
        const dateB = new Date(b.completedAt || 0);
        return dateB - dateA;
      });

      // Create the active agent with execution data
      const agentData = this.mapAgentData(scheduledTx);
      agentData.totalRuns = executionChain.length;
      agentData.successfulRuns = successCount;
      agentData.failedRuns = failedCount;
      agentData.lastExecutionAt = lastExecutionDate;
      agentData.executionHistory = executionChain;
      agentData.handlerUuid = uuid;

      activeAgents.push(agentData);
    });

    return { activeAgents };
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
      handlerUuid: agent.handler_uuid?.toString(),
      status: agent.status,
      scheduledAt: agent.scheduled_at,
      priority: agent.priority,
      executionEffort: agent.execution_effort,
      fees: agent.fees?.toString(),
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
      completedTransaction: agent.completed_transaction,
      blockHeight: agent.block_height,
      completedBlockHeight: agent.completed_block_height,
      isCompleted: agent.is_completed
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
