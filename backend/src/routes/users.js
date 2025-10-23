const express = require('express');
const prisma = require('../config/prisma');
const { validateUserUpdate, validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * GET /api/users/:address
 * Get user profile by Flow address
 */
router.get('/:address', async (req, res, next) => {
  const { address } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        agents: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            agents: true
          }
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

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          address: user.address,
          nickname: user.nickname,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        agents: user.agents,
        stats: {
          totalAgents: user._count.agents,
          activeAgents: user.agents.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting user:', error.message);
    next(error);
  }
});

/**
 * PUT /api/users/:address
 * Update user profile
 */
router.put('/:address', validateUserUpdate, validateRequest, async (req, res, next) => {
  const { address } = req.params;
  const { nickname, email } = req.body;
  
  try {
    const user = await prisma.user.findUnique({
      where: { address }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with this address'
      });
    }

    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (email !== undefined) updateData.email = email;

    const updatedUser = await prisma.user.update({
      where: { address },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          address: updatedUser.address,
          nickname: updatedUser.nickname,
          email: updatedUser.email,
          updatedAt: updatedUser.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    next(error);
  }
});

/**
 * GET /api/users/:address/scan-history
 * Get scan history for a user
 */
router.get('/:address/scan-history', async (req, res, next) => {
  const { address } = req.params;
  const { limit = 20, offset = 0 } = req.query;
  
  try {
    const scanHistory = await prisma.scanHistory.findMany({
      where: { userAddress: address },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalScans = await prisma.scanHistory.count({
      where: { userAddress: address }
    });

    res.status(200).json({
      success: true,
      data: {
        scanHistory,
        pagination: {
          total: totalScans,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < totalScans
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting scan history:', error.message);
    next(error);
  }
});

/**
 * GET /api/users/:address/dashboard
 * Get dashboard data for a user
 */
router.get('/:address/dashboard', async (req, res, next) => {
  const { address } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        agents: {
          where: { isActive: true }
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

    // Get agent statistics
    const agentStats = await prisma.agent.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: {
        status: true
      }
    });

    // Get recent scan history
    const recentScans = await prisma.scanHistory.findMany({
      where: { userAddress: address },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get upcoming scheduled agents
    const upcomingAgents = await prisma.agent.findMany({
      where: {
        userId: user.id,
        isActive: true,
        status: 'scheduled',
        scheduledAt: {
          gte: new Date()
        }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          address: user.address,
          nickname: user.nickname,
          email: user.email
        },
        stats: {
          totalAgents: user.agents.length,
          byStatus: agentStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.status;
            return acc;
          }, {}),
          recentScans: recentScans.length,
          upcomingExecutions: upcomingAgents.length
        },
        upcomingAgents: upcomingAgents.map(agent => ({
          id: agent.id,
          scheduledTxId: agent.scheduledTxId,
          handlerContract: agent.handlerContract,
          scheduledAt: agent.scheduledAt,
          nickname: agent.nickname
        })),
        recentScans: recentScans.map(scan => ({
          id: scan.id,
          agentsFound: scan.agentsFound,
          scanType: scan.scanType,
          success: scan.success,
          createdAt: scan.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error getting dashboard data:', error.message);
    next(error);
  }
});

module.exports = router;
