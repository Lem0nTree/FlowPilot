"use client"

import { useEffect, useState } from "react"
import { FlowProvider } from "@onflow/react-sdk"
import flowJSON from "../../flow.json"

interface FlowProviderWrapperProps {
  children: React.ReactNode
}

export function FlowProviderWrapper({ children }: FlowProviderWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

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
    <FlowProvider
      config={{
        accessNodeUrl: 'https://rest-testnet.onflow.org',
        flowNetwork: 'testnet',
        appDetailTitle: 'FlowPilot Agent Cockpit',
        appDetailIcon: 'https://flowpilot.app/icon.png',
        appDetailDescription: 'Manage your on-chain automation agents',
        appDetailUrl: 'https://flowpilot.app',
        discoveryWallet: 'https://fcl-discovery.onflow.org/testnet/authn',
        walletConnectProjectId: '20011d073e05a979e592a9faa846bfab',
      }}
      flowJson={flowJSON}
    >
      {children}
    </FlowProvider>
  )
}
