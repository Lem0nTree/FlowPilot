import { useFlowQuery, useFlowMutate } from "@onflow/react-sdk"

/**
 * Hook to check if user has initialized their PaymentCronTransactionHandler
 * @param address - Flow address to check
 * @returns Query result with boolean indicating if handler is initialized
 */
export function usePaymentHandlerStatus(address?: string) {
  return useFlowQuery({
    cadence: `
      import "PaymentCronTransactionHandler"
      
      access(all) fun main(address: Address): Bool {
        let account = getAccount(address)
        return account.storage.borrow<&AnyResource>(
          from: /storage/PaymentCronTransactionHandler
        ) != nil
      }
    `,
    args: (arg, t) => {
      // Return empty array if address is not provided to prevent type errors
      if (!address) return []
      return [arg(address, t.Address)]
    },
    query: { 
      enabled: !!address,
      staleTime: 30000,
    },
  })
}

/**
 * Hook to initialize the PaymentCronTransactionHandler for the current user
 * @returns Mutation hook for initializing the handler
 */
export function useInitializePaymentHandler() {
  return useFlowMutate({
    mutation: {
      onSuccess: (txId) => console.log("Handler initialized:", txId),
    },
  })
}

/**
 * Hook to schedule a payment cron job
 * @returns Mutation hook for scheduling payments
 */
export function useSchedulePaymentCron() {
  return useFlowMutate({
    mutation: {
      onSuccess: (txId) => console.log("Payment scheduled:", txId),
    },
  })
}

