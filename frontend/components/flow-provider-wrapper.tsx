"use client"

import { useEffect, useState, useMemo } from "react"
import { FlowProvider } from "@onflow/react-sdk"
import { useTheme } from "@/contexts/theme-context"
import flowJSON from "../flow.json"

interface FlowProviderWrapperProps {
  children: React.ReactNode
}

/**
 * Resolves contract addresses from flow.json based on the current network
 */
function getContractAddresses(network: string): Record<string, string> {
  const addresses: Record<string, string> = {}
  
  // Get the network alias (e.g., 'mainnet', 'testnet', 'emulator')
  const networkAlias = network || 'testnet'
  
  // Extract addresses from dependencies section
  if (flowJSON.dependencies) {
    const dependencies = flowJSON.dependencies as Record<string, any>
    
    // Map of contract names to their FCL config keys
    const contractMap: Record<string, string> = {
      'PaymentCronTransactionHandler': '0xPaymentCronTransactionHandler',
      'FlowTransactionScheduler': '0xFlowTransactionScheduler',
      'FlowTransactionSchedulerUtils': '0xFlowTransactionSchedulerUtils',
      'FlowToken': '0xFlowToken',
      'FungibleToken': '0xFungibleToken',
    }
    
    // Extract addresses for each contract
    Object.entries(contractMap).forEach(([contractName, configKey]) => {
      const contract = dependencies[contractName]
      if (contract?.aliases?.[networkAlias]) {
        // Format address with 0x prefix if not already present
        let address = contract.aliases[networkAlias]
        if (!address.startsWith('0x')) {
          address = '0x' + address
        }
        addresses[configKey] = address
      }
    })
  }
  
  return addresses
}

export function FlowProviderWrapper({ children }: FlowProviderWrapperProps) {
  const { theme } = useTheme()
  const [isClient, setIsClient] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Get network from environment variable
  const network = (process.env.NEXT_PUBLIC_FLOW_NETWORK as any) || 'testnet'
  
  // Dynamically resolve contract addresses from flow.json based on network
  const contractAddresses = useMemo(() => {
    return getContractAddresses(network)
  }, [network])

  useEffect(() => {
    setIsClient(true)
    // Add a small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Prevent hydration mismatch by only rendering on client
  if (!isClient || !isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading FlowPilot...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <FlowProvider
        config={{
          accessNodeUrl: process.env.NEXT_PUBLIC_ACCESS_NODE || 'https://rest-testnet.onflow.org',
          flowNetwork: network,
          appDetailTitle: process.env.NEXT_PUBLIC_APP_TITLE || 'Flowmatic Agent Cockpit',
          appDetailIcon: process.env.NEXT_PUBLIC_APP_ICON || 'https://flowmatic.up.railway.app/icon.png',
          appDetailDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Manage your on-chain automation agents',
          appDetailUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://flowmatic.up.railway.app',
          discoveryWallet: process.env.NEXT_PUBLIC_DISCOVERY_WALLET || 'https://fcl-discovery.onflow.org/testnet/authn',
          walletconnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000',
          // Contract addresses resolved dynamically from flow.json based on network
          ...contractAddresses,
        } as any}
        flowJson={flowJSON}
      >
        {children}
      </FlowProvider>
    </div>
  )
}
