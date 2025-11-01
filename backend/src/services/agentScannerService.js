const axios = require('axios');

class AgentScannerService {
  constructor() {
    // Dynamically choose the API URL based on FLOW_NETWORK env var
    // Falls back to NODE_ENV check for backward compatibility
    const flowNetwork = process.env.FLOW_NETWORK || (process.env.NODE_ENV === 'testnet' ? 'testnet' : 'mainnet');
    const isTestnet = flowNetwork === 'testnet';
    this.apiUrl = isTestnet 
      ? process.env.FIND_LABS_API_BASE_TESTNET 
      : process.env.FIND_LABS_API_BASE_MAINNET;

    // It's great practice to log which environment you're using on startup
    console.log(`🚀 AgentScannerService initialized for ${flowNetwork.toUpperCase()}`);
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
      const { activeAgents, completedAgents } = this.buildExecutionChains(allTransactions);

      console.log(`✅ Identified ${activeAgents.length} active agents and ${completedAgents.length} completed agents`);

      return {
        success: true,
        activeAgents: activeAgents,
        completedAgents: completedAgents,
        allTransactions: allTransactions.map(tx => this.mapAgentData(tx)),
        totalFound: activeAgents.length + completedAgents.length,
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
   * Groups transactions by following scheduled_transaction → completed_transaction linkage
   * Each transaction's scheduled_transaction should match the previous transaction's completed_transaction
   * @param {Array} transactions - All transactions from API
   * @returns {Object} - Active and completed agents with execution chains
   */
  buildExecutionChains(transactions) {
    // Build maps for efficient lookups
    const txById = new Map(); // transaction id → tx
    const txByScheduledId = new Map(); // scheduled_transaction → tx
    const completedTxIds = new Set(); // all completed_transaction IDs
    
    transactions.forEach(tx => {
      txById.set(tx.id, tx);
      if (tx.scheduled_transaction) {
        txByScheduledId.set(tx.scheduled_transaction, tx);
      }
      if (tx.completed_transaction) {
        completedTxIds.add(tx.completed_transaction);
      }
    });
    
    // Build a map to track which transactions are "children" (their scheduled_transaction
    // matches another transaction's completed_transaction)
    const isChild = new Set();
    transactions.forEach(tx => {
      if (tx.scheduled_transaction && completedTxIds.has(tx.scheduled_transaction)) {
        isChild.add(tx.id);
      }
    });
    
    // Find true chain heads: transactions that are NOT children of other transactions
    // A chain head starts a new chain (not a continuation)
    const heads = transactions.filter(tx => !isChild.has(tx.id));
    
    // Now build chains from each head, tracking which transactions we've processed
    const processedTxIds = new Set();
    const allAgentsWithChains = [];
    
    heads.forEach(head => {
      // Skip if we've already processed this transaction as part of another chain
      if (processedTxIds.has(head.id)) {
        return;
      }
      
      const chain = [];
      let current = head;
      
      // Walk forward through the chain
      while (current && !processedTxIds.has(current.id)) {
        chain.push(current);
        processedTxIds.add(current.id);
        
        // Find next transaction in chain: look for transaction whose scheduled_transaction
        // matches this transaction's completed_transaction
        const nextCompletedTx = current.completed_transaction;
        current = nextCompletedTx ? txByScheduledId.get(nextCompletedTx) : null;
      }
      
      // Only create agent if chain has at least one transaction
      if (chain.length > 0) {
        // Determine if chain is active or completed
        const lastTx = chain[chain.length - 1];
        const isActive = lastTx.status === 'scheduled';
        const isCompleted = !isActive && lastTx.is_completed;
        
        if (isActive || isCompleted) {
          const agent = this.buildAgentFromChain(chain, isActive);
          // Store agent with its chain
          allAgentsWithChains.push({ agent, chain, isActive });
        }
      }
    });
    
    // Split into active and completed, filtering out empty completed agents
    const activeAgents = allAgentsWithChains
      .filter(item => item.isActive)
      .map(item => item.agent);
    
    const completedAgents = allAgentsWithChains
      .filter(item => !item.isActive)
      .filter(item => item.agent.totalRuns > 0) // Filter out empty completed agents
      .map(item => item.agent);
    
    return { activeAgents, completedAgents };
  }

  /**
   * Deduplicate agent chains that share transactions
   * When multiple chains contain the same transaction IDs, keep only the longest chain
   * @param {Array} agentsWithChains - Array of {agent, chain, isActive} objects
   * @returns {Array} - Deduplicated array of agent objects
   */
  deduplicateAgentChains(agentsWithChains) {
    if (agentsWithChains.length <= 1) {
      return agentsWithChains;
    }

    // Build a map of transaction ID → chains that contain it
    const txIdToChains = new Map();
    
    agentsWithChains.forEach((item, index) => {
      item.chain.forEach(tx => {
        const txId = tx.id;
        if (!txIdToChains.has(txId)) {
          txIdToChains.set(txId, []);
        }
        txIdToChains.get(txId).push(index);
      });
    });
    
    // Find chains that share transactions
    const chainIndicesToRemove = new Set();
    
    agentsWithChains.forEach((item, index) => {
      if (chainIndicesToRemove.has(index)) return;
      
      // Get all other chains that share any transaction with this chain
      const overlappingChainIndices = new Set();
      item.chain.forEach(tx => {
        const chains = txIdToChains.get(tx.id) || [];
        chains.forEach(chainIdx => {
          if (chainIdx !== index) {
            overlappingChainIndices.add(chainIdx);
          }
        });
      });
      
      // For each overlapping chain, keep only the longest one
      overlappingChainIndices.forEach(otherIndex => {
        if (chainIndicesToRemove.has(otherIndex)) return;
        
        const currentChain = item.chain;
        const otherChain = agentsWithChains[otherIndex].chain;
        
        // Check if one chain is a subset of the other
        const currentTxIds = new Set(currentChain.map(tx => tx.id));
        const otherTxIds = new Set(otherChain.map(tx => tx.id));
        
        const otherIsSubset = [...otherTxIds].every(id => currentTxIds.has(id));
        const currentIsSubset = [...currentTxIds].every(id => otherTxIds.has(id));
        
        if (otherIsSubset && !currentIsSubset) {
          // Other chain is a subset of current, remove it
          chainIndicesToRemove.add(otherIndex);
        } else if (currentIsSubset && !otherIsSubset) {
          // Current chain is a subset of other, remove current
          chainIndicesToRemove.add(index);
        } else if (currentChain.length !== otherChain.length) {
          // Keep the longer chain
          if (currentChain.length > otherChain.length) {
            chainIndicesToRemove.add(otherIndex);
          } else {
            chainIndicesToRemove.add(index);
          }
        } else {
          // Same length, keep the one with the most recent scheduledAt
          const currentMostRecent = Math.max(...currentChain.map(tx => new Date(tx.scheduled_at).getTime()));
          const otherMostRecent = Math.max(...otherChain.map(tx => new Date(tx.scheduled_at).getTime()));
          
          if (currentMostRecent >= otherMostRecent) {
            chainIndicesToRemove.add(otherIndex);
          } else {
            chainIndicesToRemove.add(index);
          }
        }
      });
    });
    
    // Return only chains that weren't removed
    return agentsWithChains.filter((_, index) => !chainIndicesToRemove.has(index));
  }

  /**
   * Build agent data from a transaction chain
   * @param {Array} chain - Array of transactions in the chain
   * @param {Boolean} isActive - Whether the agent is active or completed
   * @returns {Object} - Agent data with execution history
   */
  buildAgentFromChain(chain, isActive) {
    // The "active" transaction is the most recent scheduled one
    const activeTx = chain[chain.length - 1];
    
    // Build execution history from completed transactions
    const executionHistory = chain
      .filter(tx => tx.is_completed)
      .sort((a, b) => 
        new Date(b.completed_at) - new Date(a.completed_at)
      )
      .map(tx => ({
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
      }));
    
    const successCount = executionHistory.filter(ex => ex.status === 'executed').length;
    const failedCount = executionHistory.filter(ex => ex.status === 'failed').length;
    const lastExecution = executionHistory[0]?.completedAt;
    
    const agentData = this.mapAgentData(activeTx);
    agentData.totalRuns = executionHistory.length;
    agentData.successfulRuns = successCount;
    agentData.failedRuns = failedCount;
    agentData.lastExecutionAt = lastExecution;
    agentData.executionHistory = executionHistory;
    agentData.isActive = isActive;
    agentData.chainId = chain[0].scheduled_transaction; // Use first scheduled_tx as unique chain ID
    
    return agentData;
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
