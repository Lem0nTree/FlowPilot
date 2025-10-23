const express = require('express');
const prisma = require('../config/prisma');
const AgentScannerService = require('../services/agentScannerService');
const { validateFlowAddress, validateRequest } = require('../middleware/validation');

const router = express.Router();
const agentScanner = new AgentScannerService();

/**
 * POST /api/sync
 * Smart Scan endpoint - discovers active agents for a user
 */
router.post('/', validateFlowAddress, validateRequest, async (req, res, next) => {
  const { address } = req.body;
  const SYNC_INTERVAL_MINUTES = parseInt(process.env.SYNC_CACHE_INTERVAL_MINUTES) || 5;
  
  try {
    console.log(`🔄 Starting Smart Scan for address: ${address}`);
    
    // 1. Find or create the user in a single, atomic operation
    const user = await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    });
    console.log(`👤 User processed with ID: ${user.id}`);

    // 2. Check for recent successful scan (Time-based Caching)
    const lastScan = await prisma.scanHistory.findFirst({
      where: { 
        userAddress: address, 
        success: true 
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastScan) {
      const timeSinceLastScan = (new Date() - lastScan.createdAt) / (1000 * 60);
      if (timeSinceLastScan < SYNC_INTERVAL_MINUTES) {
        console.log(`🔄 Sync skipped: Last scan was ${timeSinceLastScan.toFixed(1)} mins ago.`);
        
        // Return cached data from our database
        const cachedAgents = await prisma.agent.findMany({ 
          where: { 
            ownerAddress: address,
            isActive: true 
          },
          orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
          success: true,
          message: 'Synced from local cache',
          data: {
            user: {
              id: user.id,
              address: user.address,
              nickname: user.nickname
            },
            agents: cachedAgents.map(agent => ({
              id: agent.id,
              scheduledTxId: agent.scheduledTxId,
              handlerContract: agent.handlerContract,
              status: agent.status,
              scheduledAt: agent.scheduledAt,
              nickname: agent.nickname,
              description: agent.description,
              tags: agent.tags,
              isActive: agent.isActive
            })),
            scanSummary: {
              totalFound: cachedAgents.length,
              processed: cachedAgents.length,
              scannedAt: lastScan.createdAt,
              cached: true
            }
          }
        });
      }
    }

    // 3. Cache is stale or not found - perform full sync with state reconciliation
    console.log('Cache stale or not found. Performing full sync with state reconciliation...');
    
    // Fetch Source of Truth from API
    const scanResult = await agentScanner.scanForAgents(address);
    if (!scanResult.success) {
      throw new Error('Scan service failed to retrieve agents.');
    }

    // Create API agent map for efficient lookup
    const apiAgentMap = new Map(
      scanResult.activeAgents.map(agent => [agent.scheduledTxId, agent])
    );

    // Fetch Current State from our database
    const dbAgents = await prisma.agent.findMany({
      where: { ownerAddress: address },
      select: { id: true, scheduledTxId: true, isActive: true },
    });
    const dbAgentMap = new Map(dbAgents.map(agent => [agent.scheduledTxId, agent]));

    // 4. State Reconciliation - Compare and find differences
    const agentsToCreate = [];
    const agentsToDeactivate = [];
    const agentsToUpdate = [];

    // Find agents to create (in API but not in DB)
    for (const [txId, agentData] of apiAgentMap.entries()) {
      if (!dbAgentMap.has(txId)) {
        agentsToCreate.push({
          scheduledTxId: agentData.scheduledTxId,
          ownerAddress: agentData.ownerAddress,
          handlerContract: agentData.handlerContract,
          status: agentData.status,
          scheduledAt: new Date(agentData.scheduledAt),
          priority: agentData.priority,
          executionEffort: agentData.executionEffort ? BigInt(agentData.executionEffort) : null,
          fees: agentData.fees,
          userId: user.id
        });
      } else {
        // Agent exists - check if it needs updating
        const dbAgent = dbAgentMap.get(txId);
        if (!dbAgent.isActive) {
          agentsToUpdate.push({
            id: dbAgent.id,
            data: {
              status: agentData.status,
              scheduledAt: new Date(agentData.scheduledAt),
              priority: agentData.priority,
              executionEffort: agentData.executionEffort ? BigInt(agentData.executionEffort) : null,
              fees: agentData.fees,
              isActive: true,
              updatedAt: new Date()
            }
          });
        }
      }
    }

    // Find agents to deactivate (in DB but not in API)
    for (const [txId, dbAgent] of dbAgentMap.entries()) {
      if (!apiAgentMap.has(txId) && dbAgent.isActive) {
        agentsToDeactivate.push(txId);
      }
    }

    // 5. Execute changes in batches for performance
    const results = {
      created: 0,
      updated: 0,
      deactivated: 0
    };

    if (agentsToCreate.length > 0) {
      await prisma.agent.createMany({
        data: agentsToCreate,
      });
      results.created = agentsToCreate.length;
      console.log(`📝 Created ${results.created} new agents`);
    }

    if (agentsToUpdate.length > 0) {
      for (const update of agentsToUpdate) {
        await prisma.agent.update({
          where: { id: update.id },
          data: update.data
        });
      }
      results.updated = agentsToUpdate.length;
      console.log(`🔄 Updated ${results.updated} existing agents`);
    }

    if (agentsToDeactivate.length > 0) {
      await prisma.agent.updateMany({
        where: { scheduledTxId: { in: agentsToDeactivate } },
        data: { 
          isActive: false, 
          status: 'completed',
          updatedAt: new Date()
        },
      });
      results.deactivated = agentsToDeactivate.length;
      console.log(`📤 Deactivated ${results.deactivated} agents`);
    }

    // 6. Store successful scan history
    await prisma.scanHistory.create({
      data: {
        userAddress: address,
        agentsFound: scanResult.totalFound,
        scanType: 'reconciliation',
        success: true,
      },
    });

    // 7. Fetch final state for response
    const finalAgents = await prisma.agent.findMany({
      where: { 
        ownerAddress: address,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ State reconciliation complete: Created ${results.created}, Updated ${results.updated}, Deactivated ${results.deactivated}`);

    res.status(200).json({
      success: true,
      message: 'Smart Scan completed with state reconciliation',
      data: {
        user: {
          id: user.id,
          address: user.address,
          nickname: user.nickname
        },
        agents: finalAgents.map(agent => ({
          id: agent.id,
          scheduledTxId: agent.scheduledTxId,
          handlerContract: agent.handlerContract,
          status: agent.status,
          scheduledAt: agent.scheduledAt,
          nickname: agent.nickname,
          description: agent.description,
          tags: agent.tags,
          isActive: agent.isActive
        })),
        scanSummary: {
          totalFound: scanResult.totalFound,
          processed: finalAgents.length,
          scannedAt: scanResult.scannedAt,
          reconciliation: {
            created: results.created,
            updated: results.updated,
            deactivated: results.deactivated
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Smart Scan failed:', error.message);
    
    // Store failed scan in history
    try {
      await prisma.scanHistory.create({
        data: {
          userAddress: address,
          agentsFound: 0,
          scanType: 'initial',
          success: false,
          errorMessage: error.message
        }
      });
    } catch (historyError) {
      console.error('❌ Failed to store scan history:', historyError.message);
    }

    // Let the central error handler deal with the response
    next(error);
  }
});

/**
 * GET /api/sync/status/:address
 * Get scan status and history for a user
 */
router.get('/status/:address', async (req, res, next) => {
  const { address } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        agents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with this address'
      });
    }

    const scanHistory = await prisma.scanHistory.findMany({
      where: { userAddress: address },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          address: user.address,
          nickname: user.nickname,
          createdAt: user.createdAt
        },
        agents: user.agents,
        scanHistory: scanHistory,
        summary: {
          totalAgents: user.agents.length,
          activeAgents: user.agents.filter(a => a.isActive).length,
          lastScan: scanHistory[0]?.createdAt || null
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting scan status:', error.message);
    next(error);
  }
});

module.exports = router;
