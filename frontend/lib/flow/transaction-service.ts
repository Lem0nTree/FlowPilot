import * as fcl from "@onflow/fcl"
import * as t from "@onflow/types"
import { backendAPI } from "../api/client"
import {
  PAUSE_AGENT_TRANSACTION,
  RESUME_AGENT_TRANSACTION,
  DELETE_AGENT_TRANSACTION,
} from "./transactions"

export const transactionService = {
  async pauseAgent(agentId: string, scheduledTxId: string): Promise<string> {
    // 1. Execute on-chain transaction
    const txId = await fcl.mutate({
      cadence: PAUSE_AGENT_TRANSACTION,
      args: (arg, t) => [arg(scheduledTxId, t.String)],
      limit: 9999,
    })

    // 2. Wait for transaction to be sealed
    await fcl.tx(txId).onceSealed()

    // 3. Notify backend to update database
    await backendAPI.updateAgent(agentId, { status: "paused", isActive: false })

    return txId
  },

  async resumeAgent(agentId: string, scheduledTxId: string): Promise<string> {
    const txId = await fcl.mutate({
      cadence: RESUME_AGENT_TRANSACTION,
      args: (arg, t) => [arg(scheduledTxId, t.String)],
      limit: 9999,
    })

    await fcl.tx(txId).onceSealed()
    await backendAPI.updateAgent(agentId, { status: "scheduled", isActive: true })

    return txId
  },

  async deleteAgent(agentId: string, scheduledTxId: string): Promise<string> {
    const txId = await fcl.mutate({
      cadence: DELETE_AGENT_TRANSACTION,
      args: (arg, t) => [arg(scheduledTxId, t.String)],
      limit: 9999,
    })

    await fcl.tx(txId).onceSealed()
    await backendAPI.deleteAgent(agentId)

    return txId
  },

  // Helper to get transaction status
  async getTransactionStatus(txId: string) {
    return await fcl.tx(txId).onceExecuted()
  },
}
