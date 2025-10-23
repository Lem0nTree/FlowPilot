const express = require('express');
const prisma = require('../config/prisma');
const { validateAgentUpdate, validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * GET /api/agents/:userId
 * Get all agents for a user
 */
router.get('/:userId', async (req, res, next) => {
  const { userId } = req.params;
  const { status, isActive } = req.query;
  
  try {
    const whereClause = { userId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const agents = await prisma.agent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: {
        agents,
        total: agents.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting agents:', error.message);
    next(error);
  }
});

/**
 * GET /api/agents/agent/:agentId
 * Get specific agent details
 */
router.get('/agent/:agentId', async (req, res, next) => {
  const { agentId } = req.params;
  
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: {
          select: {
            id: true,
            address: true,
            nickname: true
          }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: 'No agent found with this ID'
      });
    }

    res.status(200).json({
      success: true,
      data: { agent }
    });

  } catch (error) {
    console.error('❌ Error getting agent:', error.message);
    next(error);
  }
});

/**
 * PUT /api/agents/agent/:agentId
 * Update agent metadata (nickname, description, tags)
 */
router.put('/agent/:agentId', validateAgentUpdate, validateRequest, async (req, res, next) => {
  const { agentId } = req.params;
  const { nickname, description, tags, isActive } = req.body;
  
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: 'No agent found with this ID'
      });
    }

    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: { agent: updatedAgent }
    });

  } catch (error) {
    console.error('❌ Error updating agent:', error.message);
    next(error);
  }
});

/**
 * DELETE /api/agents/agent/:agentId
 * Soft delete an agent (set isActive to false)
 */
router.delete('/agent/:agentId', async (req, res, next) => {
  const { agentId } = req.params;
  
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        message: 'No agent found with this ID'
      });
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: { isActive: false }
    });

    res.status(200).json({
      success: true,
      message: 'Agent deactivated successfully',
      data: { agent: updatedAgent }
    });

  } catch (error) {
    console.error('❌ Error deactivating agent:', error.message);
    next(error);
  }
});

/**
 * GET /api/agents/stats/:userId
 * Get agent statistics for a user
 */
router.get('/stats/:userId', async (req, res, next) => {
  const { userId } = req.params;
  
  try {
    const stats = await prisma.agent.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true
      }
    });

    const totalAgents = await prisma.agent.count({
      where: { userId }
    });

    const activeAgents = await prisma.agent.count({
      where: { 
        userId,
        isActive: true 
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalAgents,
        activeAgents,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('❌ Error getting agent stats:', error.message);
    next(error);
  }
});

module.exports = router;
