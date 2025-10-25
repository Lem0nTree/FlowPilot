// Type definitions for FlowPilot API integration

export interface User {
  id: string
  address: string
  nickname?: string
  email?: string
  createdAt: string
  updatedAt: string
}

export interface Agent {
  id: string
  scheduledTxId: string
  ownerAddress: string
  handlerContract: string
  status: 'scheduled' | 'executed' | 'cancelled' | 'paused' | 'active'
  scheduledAt: string
  priority?: string
  executionEffort?: string
  fees?: string
  nickname?: string
  description?: string
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastExecutedAt?: string
  userId: string
}

export interface DiscoveredAgent {
  storagePath: string
  nickname: string
  description?: string
  handlerContract?: string
  status?: string
}

export interface AgentStats {
  totalAgents: number
  activeAgents: number
  byStatus: Record<string, number>
}

export interface ScanResult {
  agentsFound: number
  agents: DiscoveredAgent[]
  scanType: 'initial' | 'rescan' | 'manual'
  success: boolean
  errorMessage?: string
}

// API Request/Response types
export interface CreateUserRequest {
  address: string
  nickname?: string
  email?: string
}

export interface UpdateAgentRequest {
  nickname?: string
  description?: string
  tags?: string[]
  isActive?: boolean
}

export interface SyncUserRequest {
  address: string
  forceRescan?: boolean
}

// Frontend-specific types (matching the existing UI)
export interface FrontendAgent {
  id: string
  name: string
  status: 'active' | 'paused'
  workflowSummary: string
  schedule: string
  nextRun: string
  createdAt: string
  lastRun: string
  totalRuns: number
  successRate: number
  gasUsed: string
  // Additional fields for backend integration
  storagePath?: string
  handlerContract?: string
  tags?: string[]
  description?: string
}
