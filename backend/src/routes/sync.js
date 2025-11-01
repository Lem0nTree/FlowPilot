const express = require('express');
const prisma = require('../config/prisma');
const AgentScannerService = require('../services/agentScannerService');
const { validateFlowAddress, validateRequest } = require('../middleware/validation');

const router = express.Router();
const agentScanner = new AgentScannerService();

/**
 * @swagger
 * /api/sync:
 *   post:
 *     summary: Smart Scan - Discover active agents for a user
 *     description: Performs a smart scan to discover and synchronize active agents for a Flow address. Uses caching and state reconciliation for optimal performance.
 *     tags: [Sync]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 example: "0x1234567890abcdef"
 *                 description: Flow blockchain address to scan for agents
 *     responses:
 *       200:
 *         description: Smart scan completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ScanResult'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateFlowAddress, validateRequest, async (req, res, next) => {
  const { address, forceRefresh } = req.body;
  const SYNC_INTERVAL_MINUTES = parseInt(process.env.SYNC_CACHE_INTERVAL_MINUTES) || 5;
  
  try {
    console.log(`🔄 Starting Smart Scan for address: ${address} (forceRefresh: ${forceRefresh})`);
    
    // 1. Find or create the user in a single, atomic operation
    const user = await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    });
    console.log(`👤 User processed with ID: ${user.id}`);

    // 2. Check for recent successful scan (Time-based Caching) - Skip if forceRefresh is true
    if (!forceRefresh) {
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
          
          // Return cached data from our database - separate active and completed
          const [cachedActiveAgents, cachedCompletedAgents] = await Promise.all([
            prisma.agent.findMany({ 
              where: { 
                ownerAddress: address,
                isActive: true 
              },
              orderBy: { createdAt: 'desc' }
            }),
            prisma.agent.findMany({ 
              where: { 
                ownerAddress: address,
                isActive: false,
                status: 'completed'
              },
              orderBy: { updatedAt: 'desc' },
              take: 50
            })
          ]);

          const mapCachedAgent = (agent) => ({
            id: agent.id,
            scheduledTxId: agent.scheduledTxId,
            handlerContract: agent.handlerContract,
            handlerUuid: agent.handlerUuid,
            chainId: agent.chainId,
            status: agent.status,
            scheduledAt: agent.scheduledAt,
            nickname: agent.nickname,
            description: agent.description,
            tags: agent.tags,
            isActive: agent.isActive,
            totalRuns: agent.totalRuns || 0,
            successfulRuns: agent.successfulRuns || 0,
            failedRuns: agent.failedRuns || 0,
            lastExecutionAt: agent.lastExecutionAt,
            executionHistory: agent.executionHistory,
            fees: agent.fees
          });

          // Filter out completed agents that are already part of active agents' execution history
          const cachedActiveAgentHistoryTxIds = new Set();
          cachedActiveAgents.forEach(agent => {
            if (agent.executionHistory && Array.isArray(agent.executionHistory)) {
              agent.executionHistory.forEach(exec => {
                if (exec.scheduledTxId) {
                  cachedActiveAgentHistoryTxIds.add(exec.scheduledTxId);
                }
              });
            }
          });
          
          const filteredCachedCompletedAgents = cachedCompletedAgents.filter(agent => 
            !cachedActiveAgentHistoryTxIds.has(agent.scheduledTxId)
          );

          return res.status(200).json({
            success: true,
            message: 'Synced from local cache',
            data: {
              user: {
                id: user.id,
                address: user.address,
                nickname: user.nickname
              },
              agents: cachedActiveAgents.map(mapCachedAgent),
              completedAgents: filteredCachedCompletedAgents.map(mapCachedAgent),
              scanSummary: {
                totalFound: cachedActiveAgents.length + filteredCachedCompletedAgents.length,
                activeCount: cachedActiveAgents.length,
                completedCount: filteredCachedCompletedAgents.length,
                processed: cachedActiveAgents.length + filteredCachedCompletedAgents.length,
                scannedAt: lastScan.createdAt,
                cached: true
              }
            }
          });
        }
      }
    }

    // 3. Cache is stale or not found - perform full sync with state reconciliation
    console.log('Cache stale or not found. Performing full sync with state reconciliation...');
    
    // Fetch Source of Truth from API
    const scanResult = await agentScanner.scanForAgents(address);
    if (!scanResult.success) {
      throw new Error('Scan service failed to retrieve agents.');
    }

    // Create API agent maps for efficient lookup (both active and completed)
    const apiActiveAgentMap = new Map(
      scanResult.activeAgents.map(agent => [agent.scheduledTxId, agent])
    );
    const apiCompletedAgentMap = new Map(
      scanResult.completedAgents.map(agent => [agent.scheduledTxId, agent])
    );

    // Fetch Current State from our database
    const dbAgents = await prisma.agent.findMany({
      where: { ownerAddress: address },
      select: { id: true, scheduledTxId: true, isActive: true, status: true },
    });
    const dbAgentMap = new Map(dbAgents.map(agent => [agent.scheduledTxId, agent]));

    // 4. State Reconciliation - Compare and find differences
    const agentsToCreate = [];
    const agentsToDeactivate = [];
    const agentsToUpdate = [];

    // Collect all scheduledTxIds that appear in active agents' execution history
    // These should not be created as separate completed agents
    const activeAgentHistoryTxIds = new Set();
    for (const agentData of apiActiveAgentMap.values()) {
      if (agentData.executionHistory && Array.isArray(agentData.executionHistory)) {
        agentData.executionHistory.forEach(execution => {
          if (execution.scheduledTxId) {
            activeAgentHistoryTxIds.add(execution.scheduledTxId);
          }
        });
      }
    }

    // Process active agents from API
    for (const [txId, agentData] of apiActiveAgentMap.entries()) {
      if (!dbAgentMap.has(txId)) {
        agentsToCreate.push({
          scheduledTxId: agentData.scheduledTxId,
          ownerAddress: agentData.ownerAddress,
          handlerContract: agentData.handlerContract,
          handlerUuid: agentData.handlerUuid,
          chainId: agentData.chainId,
          status: agentData.status,
          scheduledAt: new Date(agentData.scheduledAt),
          priority: agentData.priority,
          executionEffort: agentData.executionEffort ? BigInt(agentData.executionEffort) : null,
          fees: agentData.fees,
          totalRuns: agentData.totalRuns || 0,
          successfulRuns: agentData.successfulRuns || 0,
          failedRuns: agentData.failedRuns || 0,
          lastExecutionAt: agentData.lastExecutionAt ? new Date(agentData.lastExecutionAt) : null,
          executionHistory: agentData.executionHistory || [],
          isActive: true,
          userId: user.id
        });
      } else {
        // Agent exists - update it
        const dbAgent = dbAgentMap.get(txId);
        agentsToUpdate.push({
          id: dbAgent.id,
          data: {
            status: agentData.status,
            chainId: agentData.chainId,
            totalRuns: agentData.totalRuns || 0,
            successfulRuns: agentData.successfulRuns || 0,
            failedRuns: agentData.failedRuns || 0,
            lastExecutionAt: agentData.lastExecutionAt ? new Date(agentData.lastExecutionAt) : null,
            executionHistory: agentData.executionHistory || [],
            isActive: true,
            updatedAt: new Date()
          }
        });
      }
    }

    // Process completed agents from API
    // Skip completed agents that are already part of an active agent's execution history
    for (const [txId, agentData] of apiCompletedAgentMap.entries()) {
      // Skip if this completed agent's scheduledTxId appears in any active agent's execution history
      if (activeAgentHistoryTxIds.has(txId)) {
        console.log(`⏭️  Skipping completed agent ${txId} - already part of active agent's execution history`);
        // If it exists in DB, mark it as deactivated (it's now part of an active agent's chain)
        if (dbAgentMap.has(txId)) {
          const dbAgent = dbAgentMap.get(txId);
          if (dbAgent.isActive) {
            agentsToUpdate.push({
              id: dbAgent.id,
              data: {
                isActive: false,
                status: 'completed',
                updatedAt: new Date()
              }
            });
          }
        }
        continue;
      }
      if (!dbAgentMap.has(txId)) {
        agentsToCreate.push({
          scheduledTxId: agentData.scheduledTxId,
          ownerAddress: agentData.ownerAddress,
          handlerContract: agentData.handlerContract,
          handlerUuid: agentData.handlerUuid,
          chainId: agentData.chainId,
          status: 'completed',
          scheduledAt: new Date(agentData.scheduledAt),
          priority: agentData.priority,
          executionEffort: agentData.executionEffort ? BigInt(agentData.executionEffort) : null,
          fees: agentData.fees,
          totalRuns: agentData.totalRuns || 0,
          successfulRuns: agentData.successfulRuns || 0,
          failedRuns: agentData.failedRuns || 0,
          lastExecutionAt: agentData.lastExecutionAt ? new Date(agentData.lastExecutionAt) : null,
          executionHistory: agentData.executionHistory || [],
          isActive: false,
          userId: user.id
        });
      } else {
        // Agent exists - mark as completed
        const dbAgent = dbAgentMap.get(txId);
        if (dbAgent.status !== 'completed') {
          agentsToUpdate.push({
            id: dbAgent.id,
            data: {
              status: 'completed',
              chainId: agentData.chainId,
              totalRuns: agentData.totalRuns || 0,
              successfulRuns: agentData.successfulRuns || 0,
              failedRuns: agentData.failedRuns || 0,
              lastExecutionAt: agentData.lastExecutionAt ? new Date(agentData.lastExecutionAt) : null,
              executionHistory: agentData.executionHistory || [],
              isActive: false,
              updatedAt: new Date()
            }
          });
        }
      }
    }

    // Find agents to deactivate:
    // 1. Agents in DB but not in API (neither active nor completed)
    // 2. Completed agents in DB that are now part of an active agent's execution history
    for (const [txId, dbAgent] of dbAgentMap.entries()) {
      // Check if agent is in API
      const inActive = apiActiveAgentMap.has(txId);
      const inCompleted = apiCompletedAgentMap.has(txId);
      
      if (!inActive && !inCompleted && dbAgent.isActive) {
        // Agent was active but no longer in API
        agentsToDeactivate.push(txId);
      } else if (!inActive && activeAgentHistoryTxIds.has(txId)) {
        // Agent is not active in API but is part of an active agent's history
        // Delete it since it's redundant (already represented in the active agent's execution history)
        console.log(`🗑️  Marking agent ${txId} for deletion - now part of active agent's execution history`);
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
      // Use upsert for each agent to handle race conditions
      for (const agentData of agentsToCreate) {
        try {
          await prisma.agent.upsert({
            where: { scheduledTxId: agentData.scheduledTxId },
            update: {
              // Update with latest data if it already exists
              status: agentData.status,
              scheduledAt: agentData.scheduledAt,
              priority: agentData.priority,
              executionEffort: agentData.executionEffort,
              fees: agentData.fees,
              totalRuns: agentData.totalRuns,
              successfulRuns: agentData.successfulRuns,
              failedRuns: agentData.failedRuns,
              lastExecutionAt: agentData.lastExecutionAt,
              executionHistory: agentData.executionHistory,
              isActive: true,
              updatedAt: new Date()
            },
            create: agentData
          });
          results.created++;
        } catch (error) {
          // If it's a unique constraint error, the agent already exists - skip
          if (error.code === 'P2002') {
            console.log(`⚠️ Agent ${agentData.scheduledTxId} already exists, skipping creation`);
            continue;
          }
          throw error; // Re-throw other errors
        }
      }
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

    // 7. Fetch final state for response - separate active and completed
    const [activeAgents, completedAgents] = await Promise.all([
      prisma.agent.findMany({
        where: { 
          ownerAddress: address,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.agent.findMany({
        where: { 
          ownerAddress: address,
          isActive: false,
          status: 'completed'
        },
        orderBy: { updatedAt: 'desc' },
        take: 50 // Limit completed agents shown
      })
    ]);

    console.log(`✅ State reconciliation complete: Created ${results.created}, Updated ${results.updated}, Deactivated ${results.deactivated}`);

    const mapAgentData = (agent) => ({
      id: agent.id,
      scheduledTxId: agent.scheduledTxId,
      handlerContract: agent.handlerContract,
      handlerUuid: agent.handlerUuid,
      chainId: agent.chainId,
      status: agent.status,
      scheduledAt: agent.scheduledAt,
      nickname: agent.nickname,
      description: agent.description,
      tags: agent.tags,
      isActive: agent.isActive,
      totalRuns: agent.totalRuns || 0,
      successfulRuns: agent.successfulRuns || 0,
      failedRuns: agent.failedRuns || 0,
      lastExecutionAt: agent.lastExecutionAt,
      executionHistory: agent.executionHistory,
      fees: agent.fees
    });

    // Filter out completed agents that are already part of active agents' execution history
    // These are redundant since they're already represented in the active agent's chain
    const activeAgentHistoryTxIdsSet = new Set();
    activeAgents.forEach(agent => {
      if (agent.executionHistory && Array.isArray(agent.executionHistory)) {
        agent.executionHistory.forEach(exec => {
          if (exec.scheduledTxId) {
            activeAgentHistoryTxIdsSet.add(exec.scheduledTxId);
          }
        });
      }
    });
    
    const filteredCompletedAgents = completedAgents.filter(agent => {
      const isInActiveHistory = activeAgentHistoryTxIdsSet.has(agent.scheduledTxId);
      if (isInActiveHistory) {
        console.log(`⏭️  Filtering out completed agent ${agent.scheduledTxId} - already in active agent's execution history`);
      }
      return !isInActiveHistory;
    });

    res.status(200).json({
      success: true,
      message: 'Smart Scan completed with state reconciliation',
      data: {
        user: {
          id: user.id,
          address: user.address,
          nickname: user.nickname
        },
        agents: activeAgents.map(mapAgentData),
        completedAgents: filteredCompletedAgents.map(mapAgentData),
        scanSummary: {
          totalFound: scanResult.totalFound,
          activeCount: activeAgents.length,
          completedCount: filteredCompletedAgents.length,
          processed: activeAgents.length + filteredCompletedAgents.length,
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
 * @swagger
 * /api/sync/status/{address}:
 *   get:
 *     summary: Get scan status and history for a user
 *     description: Retrieves the current scan status and history for a specific Flow address
 *     tags: [Sync]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         example: "0x1234567890abcdef"
 *         description: Flow blockchain address
 *     responses:
 *       200:
 *         description: Scan status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         agents:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Agent'
 *                         scanHistory:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ScanHistory'
 *                         summary:
 *                           type: object
 *                           properties:
 *                             totalAgents:
 *                               type: integer
 *                             activeAgents:
 *                               type: integer
 *                             lastScan:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
