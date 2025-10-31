import { useFlowMutate, useFlowScheduledTransactionCancel } from "@onflow/react-sdk"
import { backendAPI } from "../api/client"
import { handleFCLError } from "./error-handler"
import { useAgentAuthorization } from "./auth"

// Transaction Cadence code - Uses Manager resource to cancel scheduled transaction
const PAUSE_AGENT_TRANSACTION = `
import "FlowTransactionSchedulerUtils"

transaction(scheduledTxId: UInt64) {
  prepare(signer: auth(Storage) &Account) {
    // Borrow the Manager resource from storage
    let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
      from: FlowTransactionSchedulerUtils.managerStoragePath
    ) ?? panic("Could not borrow Manager reference")
    
    // Cancel the scheduled transaction through the Manager
    manager.cancelByID(scheduledTxId)
  }
}
`

const RESUME_AGENT_TRANSACTION = `
import "FlowTransactionSchedulerUtils"

transaction(scheduledTxId: UInt64) {
  prepare(signer: auth(Storage) &Account) {
    // Note: Flow Scheduled Transactions cannot be "resumed" after cancellation.
    // To resume an agent, you would need to schedule a new transaction with the same parameters.
    // This would require storing the original handler and parameters, then calling manager.schedule() again.
    panic("Resume functionality requires rescheduling - not yet implemented")
  }
}
`

const DELETE_AGENT_TRANSACTION = `
import "FlowTransactionSchedulerUtils"
import "FlowToken"
import "FungibleToken"

transaction(scheduledTxId: UInt64) {
  prepare(signer: auth(BorrowValue) &Account) {
    // Borrow the Manager resource from storage
    let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
      from: FlowTransactionSchedulerUtils.managerStoragePath
    ) ?? panic("Could not borrow Manager reference. Make sure you have scheduled transactions.")
    
    // Get the vault where the refund should be deposited
    let vault = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
      ?? panic("Could not borrow FlowToken vault")
    
    // Cancel the scheduled transaction and receive refund
    // The cancel method returns a FlowToken.Vault containing the partial refund
    let refund <- manager.cancel(id: scheduledTxId)
    vault.deposit(from: <-refund)
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
        // This is best-effort - if it fails, the on-chain transaction already succeeded
        try {
          await backendAPI.deleteAgent(variables.agentId)
        } catch (error) {
          console.warn("Backend delete failed, but on-chain transaction succeeded:", error)
          // Don't throw - the on-chain deletion was successful
        }
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
        args: (arg, t) => [arg(scheduledTxId, t.UInt64)],
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
        args: (arg, t) => [arg(scheduledTxId, t.UInt64)],
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
        args: (arg, t) => [arg(scheduledTxId, t.UInt64)],
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
