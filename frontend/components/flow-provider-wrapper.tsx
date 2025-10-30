"use client"

import { useEffect, useState } from "react"
import { FlowProvider } from "@onflow/react-sdk"
import { useTheme } from "@/contexts/theme-context"
import flowJSON from "../flow.json"

interface FlowProviderWrapperProps {
  children: React.ReactNode
}

export function FlowProviderWrapper({ children }: FlowProviderWrapperProps) {
  const { theme } = useTheme()
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
    <div className={theme === "dark" ? "dark" : ""}>
      <FlowProvider
        config={{
          accessNodeUrl: process.env.NEXT_PUBLIC_ACCESS_NODE || 'https://rest-testnet.onflow.org',
          flowNetwork: (process.env.NEXT_PUBLIC_FLOW_NETWORK as any) || 'testnet',
          appDetailTitle: process.env.NEXT_PUBLIC_APP_TITLE || 'FlowPilot Agent Cockpit',
          appDetailIcon: process.env.NEXT_PUBLIC_APP_ICON || 'https://flowpilot.up.railway.app/icon.png',
          appDetailDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Manage your on-chain automation agents',
          appDetailUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://flowpilot.up.railway.app',
          discoveryWallet: process.env.NEXT_PUBLIC_DISCOVERY_WALLET || 'https://fcl-discovery.onflow.org/testnet/authn',
          walletconnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '20011d073e05a979e592a9faa846bfab',
          // Contract addresses for string imports (using type assertion for custom config)
          '0xPaymentCronTransactionHandler': '0x6cc67be8d78c0bd1',
          '0xFlowTransactionScheduler': '0x8c5303eaa26202d6',
          '0xFlowTransactionSchedulerUtils': '0x8c5303eaa26202d6',
          '0xFlowToken': '0x7e60df042a9c0868',
          '0xFungibleToken': '0x9a0766d93b6608b7',
        } as any}
        flowJson={flowJSON}
      >
        {children}
      </FlowProvider>
    </div>
  )
}
