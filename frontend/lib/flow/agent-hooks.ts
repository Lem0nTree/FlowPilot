import { useFlowMutate } from "@onflow/react-sdk"
import { backendAPI } from "../api/client"
import { handleFCLError } from "./error-handler"
import { useAgentAuthorization } from "./auth"

// Transaction Cadence code
const PAUSE_AGENT_TRANSACTION = `
import FlowTransactionScheduler from 0xFlowTransactionScheduler

transaction(scheduledTxId: String) {
  prepare(signer: auth(Storage) &Account) {
    // Get the scheduled transaction and cancel it
    let scheduler = FlowTransactionScheduler.getScheduler()
    scheduler.cancel(id: scheduledTxId)
  }
}
`

const RESUME_AGENT_TRANSACTION = `
import FlowTransactionScheduler from 0xFlowTransactionScheduler

transaction(scheduledTxId: String) {
  prepare(signer: auth(Storage) &Account) {
    // Reschedule the transaction
    // Implementation depends on your agent contract design
  }
}
`

const DELETE_AGENT_TRANSACTION = `
import FlowTransactionScheduler from 0xFlowTransactionScheduler

transaction(scheduledTxId: String) {
  prepare(signer: auth(Storage) &Account) {
    // Cancel and remove the scheduled transaction
    let scheduler = FlowTransactionScheduler.getScheduler()
    scheduler.cancel(id: scheduledTxId)
    // Additional cleanup if needed
  }
}
`

export function usePauseAgent() {
  return useFlowMutate({
    mutation: {
      onSuccess: async (txId, variables) => {
        // Wait for transaction to be sealed
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Notify backend to update database
        await backendAPI.updateAgent(variables.agentId, { 
          status: "paused", 
          isActive: false 
        })
      },
      onError: (error) => {
        console.error("Pause agent error:", error)
      },
      retry: 2,
      retryDelay: 1000
    }
  })
}

export function useResumeAgent() {
  return useFlowMutate({
    mutation: {
      onSuccess: async (txId, variables) => {
        // Wait for transaction to be sealed
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Notify backend to update database
        await backendAPI.updateAgent(variables.agentId, { 
          status: "scheduled", 
          isActive: true 
        })
      },
      onError: (error) => {
        console.error("Resume agent error:", error)
      },
      retry: 2,
      retryDelay: 1000
    }
  })
}

export function useDeleteAgent() {
  return useFlowMutate({
    mutation: {
      onSuccess: async (txId, variables) => {
        // Wait for transaction to be sealed
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Notify backend to delete agent
        await backendAPI.deleteAgent(variables.agentId)
      },
      onError: (error) => {
        console.error("Delete agent error:", error)
      },
      retry: 2,
      retryDelay: 1000
    }
  })
}

// Helper function to execute agent actions
export function useAgentActions() {
  const pauseMutation = usePauseAgent()
  const resumeMutation = useResumeAgent()
  const deleteMutation = useDeleteAgent()
  const authorization = useAgentAuthorization()

  const pauseAgent = async (agentId: string, scheduledTxId: string) => {
    return new Promise<string>((resolve, reject) => {
      pauseMutation.mutate({
        cadence: PAUSE_AGENT_TRANSACTION,
        args: (arg, t) => [arg(scheduledTxId, t.String)],
        authorizations: [authorization],
        limit: 9999,
        agentId
      }, {
        onSuccess: (txId) => resolve(txId),
        onError: (error) => reject(error)
      })
    })
  }

  const resumeAgent = async (agentId: string, scheduledTxId: string) => {
    return new Promise<string>((resolve, reject) => {
      resumeMutation.mutate({
        cadence: RESUME_AGENT_TRANSACTION,
        args: (arg, t) => [arg(scheduledTxId, t.String)],
        authorizations: [authorization],
        limit: 9999,
        agentId
      }, {
        onSuccess: (txId) => resolve(txId),
        onError: (error) => reject(error)
      })
    })
  }

  const deleteAgent = async (agentId: string, scheduledTxId: string) => {
    return new Promise<string>((resolve, reject) => {
      deleteMutation.mutate({
        cadence: DELETE_AGENT_TRANSACTION,
        args: (arg, t) => [arg(scheduledTxId, t.String)],
        authorizations: [authorization],
        limit: 9999,
        agentId
      }, {
        onSuccess: (txId) => resolve(txId),
        onError: (error) => reject(error)
      })
    })
  }

  return {
    pauseAgent,
    resumeAgent,
    deleteAgent,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    pauseError: pauseMutation.error,
    resumeError: resumeMutation.error,
    deleteError: deleteMutation.error,
  }
}
