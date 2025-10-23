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
  
  try {
    console.log(`🔄 Starting Smart Scan for address: ${address}`);
    
    // 1. Find or create the user in a single, atomic operation
    const user = await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    });
    console.log(`👤 User processed with ID: ${user.id}`);

    // 2. Perform the scan
    const scanResult = await agentScanner.scanForAgents(address);
    if (!scanResult.success) {
      throw new Error('Scan service failed to retrieve agents.');
    }

    // 3. Process and store agents using upsert with parallel execution
    const agentUpsertPromises = scanResult.activeAgents.map(agentData => 
      prisma.agent.upsert({
        where: { scheduledTxId: agentData.scheduledTxId },
        update: {
          status: agentData.status,
          scheduledAt: new Date(agentData.scheduledAt),
          priority: agentData.priority,
          executionEffort: agentData.executionEffort,
          fees: agentData.fees,
          updatedAt: new Date()
        },
        create: {
          scheduledTxId: agentData.scheduledTxId,
          ownerAddress: agentData.ownerAddress,
          handlerContract: agentData.handlerContract,
          status: agentData.status,
          scheduledAt: new Date(agentData.scheduledAt),
          priority: agentData.priority,
          executionEffort: agentData.executionEffort,
          fees: agentData.fees,
          userId: user.id
        },
      })
    );
    
    // Execute all database operations in parallel
    const processedAgents = await Promise.all(agentUpsertPromises);

    // 4. Store successful scan history
    await prisma.scanHistory.create({
      data: {
        userAddress: address,
        agentsFound: scanResult.totalFound,
        scanType: 'initial',
        success: true,
      },
    });

    console.log(`✅ Smart Scan completed: ${processedAgents.length} agents processed`);

    res.status(200).json({
      success: true,
      message: 'Smart Scan completed successfully',
      data: {
        user: {
          id: user.id,
          address: user.address,
          nickname: user.nickname
        },
        agents: processedAgents.map(agent => ({
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
          processed: processedAgents.length,
          scannedAt: scanResult.scannedAt
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
