const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FlowPilot Backend API',
      version: '1.0.0',
      description: 'FlowPilot Backend - Smart Scan Service for Flow Agents',
      contact: {
        name: 'FlowPilot Team',
        email: 'support@flowpilot.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.flowpilot.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Validation Error'
            },
            message: {
              type: 'string',
              example: 'Invalid request parameters'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            address: {
              type: 'string',
              example: '0x1234567890abcdef',
              description: 'Flow blockchain address'
            },
            nickname: {
              type: 'string',
              example: 'FlowUser123',
              nullable: true
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        Agent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            scheduledTxId: {
              type: 'string',
              example: '0xabcdef1234567890',
              description: 'Scheduled transaction ID on Flow blockchain'
            },
            ownerAddress: {
              type: 'string',
              example: '0x1234567890abcdef',
              description: 'Flow address of the agent owner'
            },
            handlerContract: {
              type: 'string',
              example: 'CounterTransactionHandler',
              description: 'Contract name handling the scheduled transaction'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'executed', 'cancelled', 'failed', 'completed'],
              example: 'scheduled'
            },
            scheduledAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T12:00:00.000Z'
            },
            priority: {
              type: 'integer',
              minimum: 0,
              maximum: 2,
              example: 1,
              description: '0=High, 1=Medium, 2=Low'
            },
            executionEffort: {
              type: 'string',
              example: '1000',
              description: 'Execution effort in computation units'
            },
            fees: {
              type: 'number',
              example: 0.001,
              description: 'Transaction fees in FLOW'
            },
            nickname: {
              type: 'string',
              example: 'My Counter Agent',
              nullable: true
            },
            description: {
              type: 'string',
              example: 'Automated counter increment agent',
              nullable: true
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['automation', 'counter', 'daily'],
              nullable: true
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            userId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        ScanHistory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            userAddress: {
              type: 'string',
              example: '0x1234567890abcdef'
            },
            agentsFound: {
              type: 'integer',
              example: 5
            },
            scanType: {
              type: 'string',
              enum: ['initial', 'reconciliation', 'manual'],
              example: 'reconciliation'
            },
            success: {
              type: 'boolean',
              example: true
            },
            errorMessage: {
              type: 'string',
              example: 'Network timeout',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        ScanResult: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Smart Scan completed with state reconciliation'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                agents: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Agent'
                  }
                },
                scanSummary: {
                  type: 'object',
                  properties: {
                    totalFound: {
                      type: 'integer',
                      example: 5
                    },
                    processed: {
                      type: 'integer',
                      example: 5
                    },
                    scannedAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2024-01-01T00:00:00.000Z'
                    },
                    cached: {
                      type: 'boolean',
                      example: false
                    },
                    reconciliation: {
                      type: 'object',
                      properties: {
                        created: {
                          type: 'integer',
                          example: 2
                        },
                        updated: {
                          type: 'integer',
                          example: 1
                        },
                        deactivated: {
                          type: 'integer',
                          example: 1
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        AgentStats: {
          type: 'object',
          properties: {
            totalAgents: {
              type: 'integer',
              example: 10
            },
            activeAgents: {
              type: 'integer',
              example: 8
            },
            byStatus: {
              type: 'object',
              properties: {
                scheduled: {
                  type: 'integer',
                  example: 5
                },
                executed: {
                  type: 'integer',
                  example: 2
                },
                completed: {
                  type: 'integer',
                  example: 1
                }
              }
            }
          }
        },
        DashboardData: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            stats: {
              $ref: '#/components/schemas/AgentStats'
            },
            upcomingAgents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  scheduledTxId: {
                    type: 'string'
                  },
                  handlerContract: {
                    type: 'string'
                  },
                  scheduledAt: {
                    type: 'string',
                    format: 'date-time'
                  },
                  nickname: {
                    type: 'string',
                    nullable: true
                  }
                }
              }
            },
            recentScans: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid'
                  },
                  agentsFound: {
                    type: 'integer'
                  },
                  scanType: {
                    type: 'string'
                  },
                  success: {
                    type: 'boolean'
                  },
                  createdAt: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Sync',
        description: 'Smart scan and synchronization endpoints'
      },
      {
        name: 'Agents',
        description: 'Agent management endpoints'
      },
      {
        name: 'Users',
        description: 'User profile and dashboard endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/server.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = specs;
