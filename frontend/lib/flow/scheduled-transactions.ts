import { 
  useFlowScheduledTransactionList, 
  useFlowScheduledTransactionCancel,
  useFlowScheduledTransaction,
  useFlowScheduledTransactionSetup
} from "@onflow/react-sdk"
import { backendAPI } from "../api/client"

// Hook to get all scheduled transactions for an account
export function useAgentScheduledTransactions(account?: string) {
  const { 
    data: scheduledTransactions, 
    isLoading, 
    error, 
    refetch 
  } = useFlowScheduledTransactionList({
    account,
    includeHandlerData: true,
    query: { 
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchInterval: 60000, // 1 minute
      enabled: !!account // Only run when account is provided
    }
  })

  // Map scheduled transactions to agent format
  const agents = scheduledTransactions?.map(tx => {
    try {
      return {
        id: tx.id,
        name: `Agent ${tx.id.slice(0, 8)}`,
        status: getStatusFromScheduledTx(tx.status),
        workflowSummary: "Automated agent",
        schedule: "Scheduled",
        nextRun: new Date(tx.scheduledTimestamp).toLocaleString(),
        createdAt: new Date(tx.scheduledTimestamp).toLocaleDateString(),
        lastRun: "Unknown",
        totalRuns: 0,
        successRate: 100,
        gasUsed: tx.fees ? `${tx.fees.formatted} FLOW` : "0.001 FLOW",
        scheduledTxId: tx.id,
        priority: tx.priority,
        executionEffort: tx.executionEffort,
        handlerType: tx.handlerTypeIdentifier,
        handlerAddress: tx.handlerAddress
      }
    } catch (error) {
      console.error("Error mapping scheduled transaction:", error, tx)
      return {
        id: tx.id,
        name: `Agent ${tx.id.slice(0, 8)}`,
        status: "paused" as const,
        workflowSummary: "Automated agent",
        schedule: "Scheduled",
        nextRun: "Unknown",
        createdAt: new Date().toLocaleDateString(),
        lastRun: "Unknown",
        totalRuns: 0,
        successRate: 100,
        gasUsed: "0.001 FLOW",
        scheduledTxId: tx.id
      }
    }
  }) || []

  return {
    agents,
    isLoading,
    error,
    refetch
  }
}

// Hook to cancel a scheduled transaction
export function useCancelScheduledTransaction() {
  const cancelMutation = useFlowScheduledTransactionCancel({
    mutation: {
      onSuccess: async (txId, scheduledTxId) => {
        // Notify backend to update agent status
        try {
          await backendAPI.updateAgent(scheduledTxId, { 
            status: "cancelled", 
            isActive: false 
          })
        } catch (error) {
          console.error("Failed to update backend:", error)
        }
      },
      onError: (error) => {
        console.error("Cancel scheduled transaction error:", error)
      }
    }
  })

  const cancelTransaction = (scheduledTxId: string) => {
    return cancelMutation.cancelTransactionAsync(scheduledTxId)
  }

  return {
    cancelTransaction,
    isCancelling: cancelMutation.isPending,
    error: cancelMutation.error
  }
}

// Hook to get details of a specific scheduled transaction
export function useScheduledTransactionDetails(txId?: string) {
  return useFlowScheduledTransaction({
    txId,
    includeHandlerData: true,
    query: { 
      staleTime: 10000,
      enabled: !!txId
    }
  })
}

// Hook to setup the transaction scheduler manager
export function useScheduledTransactionSetup() {
  const setupMutation = useFlowScheduledTransactionSetup({
    mutation: {
      onSuccess: (txId) => {
        console.log("Transaction scheduler setup successful:", txId)
      },
      onError: (error) => {
        console.error("Setup error:", error)
      }
    }
  })

  const setupScheduler = () => {
    return setupMutation.setupAsync()
  }

  return {
    setupScheduler,
    isSettingUp: setupMutation.isPending,
    error: setupMutation.error
  }
}

// Helper function to map scheduled transaction status to agent status
function getStatusFromScheduledTx(status: number): "active" | "paused" | "scheduled" {
  switch (status) {
    case 0: // Pending
      return "scheduled"
    case 1: // Processing
      return "active"
    case 2: // Completed
      return "active"
    case 3: // Failed
      return "paused"
    case 4: // Cancelled
      return "paused"
    default:
      return "paused"
  }
}
