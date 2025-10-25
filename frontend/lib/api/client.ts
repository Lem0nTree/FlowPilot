const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export interface Agent {
  id: string
  scheduledTxId: string
  ownerAddress: string
  handlerContract: string
  status: string
  scheduledAt: string
  nickname?: string
  description?: string
  tags?: string[]
  isActive: boolean
}

export interface SyncResponse {
  success: boolean
  message: string
  data: {
    user: { id: string; address: string; nickname?: string }
    agents: Agent[]
    scanSummary: {
      totalFound: number
      processed: number
      scannedAt: string
      cached?: boolean
    }
  }
}

export const backendAPI = {
  // Smart Scan - discovers agents via Find Labs API
  async syncAgents(address: string, forceRefresh = false): Promise<SyncResponse> {
    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, forceRefresh }),
    })
    if (!response.ok) throw new Error("Sync failed")
    return response.json()
  },

  // Get agents from backend database
  async getAgents(userId: string): Promise<Agent[]> {
    const response = await fetch(`${API_BASE_URL}/agents/${userId}`)
    if (!response.ok) throw new Error("Failed to fetch agents")
    const data = await response.json()
    return data.data.agents
  },

  // Update agent metadata after transaction
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/agents/agent/${agentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (!response.ok) throw new Error("Failed to update agent")
  },

  // Soft delete agent in backend
  async deleteAgent(agentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/agents/agent/${agentId}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Failed to delete agent")
  },
}