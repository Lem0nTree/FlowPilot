const express = require('express');
const prisma = require('../config/prisma');
const { validateAgentUpdate, validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/agents/{userId}:
 *   get:
 *     summary: Get all agents for a user
 *     description: Retrieves all agents associated with a specific user ID with optional filtering
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *         description: User ID
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [scheduled, executed, cancelled, failed, completed]
 *         example: "scheduled"
 *         description: Filter by agent status
 *       - in: query
 *         name: isActive
 *         required: false
 *         schema:
 *           type: boolean
 *         example: true
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Agents retrieved successfully
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
 *                         agents:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Agent'
 *                         total:
 *                           type: integer
 *                           example: 5
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/agents/agent/{agentId}:
 *   get:
 *     summary: Get specific agent details
 *     description: Retrieves detailed information about a specific agent by ID
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent details retrieved successfully
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
 *                         agent:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Agent'
 *                             - type: object
 *                               properties:
 *                                 user:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: string
 *                                       format: uuid
 *                                     address:
 *                                       type: string
 *                                     nickname:
 *                                       type: string
 *                                       nullable: true
 *       404:
 *         description: Agent not found
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
 * @swagger
 * /api/agents/agent/{agentId}:
 *   put:
 *     summary: Update agent metadata
 *     description: Updates agent metadata including nickname, description, tags, and active status
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *         description: Agent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 example: "My Counter Agent"
 *                 description: Custom nickname for the agent
 *               description:
 *                 type: string
 *                 example: "Automated counter increment agent"
 *                 description: Description of the agent's purpose
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["automation", "counter", "daily"]
 *                 description: Tags for categorizing the agent
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the agent is active
 *     responses:
 *       200:
 *         description: Agent updated successfully
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
 *                         agent:
 *                           $ref: '#/components/schemas/Agent'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Agent not found
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
 * @swagger
 * /api/agents/agent/{agentId}:
 *   delete:
 *     summary: Soft delete an agent
 *     description: Deactivates an agent by setting isActive to false (soft delete)
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent deactivated successfully
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
 *                         agent:
 *                           $ref: '#/components/schemas/Agent'
 *       404:
 *         description: Agent not found
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
 * @swagger
 * /api/agents/stats/{userId}:
 *   get:
 *     summary: Get agent statistics for a user
 *     description: Retrieves statistical information about agents for a specific user
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *         description: User ID
 *     responses:
 *       200:
 *         description: Agent statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AgentStats'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
