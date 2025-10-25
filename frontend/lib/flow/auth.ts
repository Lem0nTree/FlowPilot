import { useFlowAuthz } from "@onflow/react-sdk"

// Wrapper around useFlowAuthz for consistent authorization
export function useFlowAuthorization() {
  return useFlowAuthz()
}

// Export the authorization function for use in transactions
export function useAgentAuthorization() {
  const authorization = useFlowAuthz()
  
  return authorization
}
