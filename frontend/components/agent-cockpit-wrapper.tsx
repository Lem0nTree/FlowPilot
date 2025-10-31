"use client"

import { useState, useEffect, useMemo } from "react"
import { useFlowCurrentUser, useDarkMode, Connect, TransactionDialog } from "@onflow/react-sdk"
import { useTheme } from "@/contexts/theme-context"
import { backendAPI, type Agent as BackendAgent } from "@/lib/api/client"
import { useAgentActions } from "@/lib/flow/agent-hooks"
import { usePaymentHandlerStatus, useInitializePaymentHandler, useSchedulePaymentCron } from "@/lib/flow/payment-agent-hooks"
import { INIT_PAYMENT_HANDLER_TX, SCHEDULE_PAYMENT_CRON_TX } from "@/lib/flow/cadence-transactions"
import { handleFCLError } from "@/lib/flow/error-handler"
import { AgentRow } from "@/components/agent-row"
import { EmptyState } from "@/components/empty-state"
import { LoadingState } from "@/components/loading-state"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { OnboardingWelcome, type DiscoveredAgent } from "@/components/onboarding-welcome"
import { OnboardingConfirmation } from "@/components/onboarding-confirmation"
import { OnboardingSuccess } from "@/components/onboarding-success"
import { AgentTemplatesSidebar } from "@/components/agent-template-sidebar"
import { TemplateConfigPanel } from "@/components/template-config-panel"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Wallet, Plus, Sun, Moon, RefreshCw, Loader2 } from "lucide-react"
import Image from "next/image"

type Agent = {
  id: string
  name: string
  status: "active" | "paused" | "scheduled" | "stopped" | "error" | "completed"
  workflowSummary: string
  schedule: string
  nextRun: string
  createdAt: string
  lastRun: string
  totalRuns: number
  successRate: number
  gasUsed: string
  scheduledTxId?: string
  handlerContract?: string
  executionHistory?: any[]
}

// Cache key constants
const AGENTS_CACHE_KEY = "flowpilot-agents-cache"
const CACHE_TIMESTAMP_KEY = "flowpilot-cache-timestamp"

// Helper functions
const getCachedAgents = (): Agent[] => {
  if (typeof window === "undefined") return []
  const cached = localStorage.getItem(AGENTS_CACHE_KEY)
  return cached ? JSON.parse(cached) : []
}

const setCachedAgents = (agents: Agent[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem(AGENTS_CACHE_KEY, JSON.stringify(agents))
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
}

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Weekly FLOW Purchase Bot",
    status: "active",
    workflowSummary: "Swaps 10.0 FUSD for FLOW",
    schedule: "Every Monday at 9:00 AM",
    nextRun: "In 3 days, 4 hours",
    createdAt: "Jan 15, 2025",
    lastRun: "4 days ago",
    totalRuns: 24,
    successRate: 100,
    gasUsed: "0.0012 FLOW",
  },
  {
    id: "2",
    name: "Auto Staking Rewards",
    status: "active",
    workflowSummary: "Stakes all available FLOW rewards",
    schedule: "Daily at 12:00 PM",
    nextRun: "In 8 hours",
    createdAt: "Dec 20, 2024",
    lastRun: "16 hours ago",
    totalRuns: 52,
    successRate: 98,
    gasUsed: "0.0008 FLOW",
  },
  {
    id: "3",
    name: "NFT Minting Bot",
    status: "paused",
    workflowSummary: "Mints one ExampleNFT",
    schedule: "Every Friday at 3:00 PM",
    nextRun: "Paused",
    createdAt: "Jan 5, 2025",
    lastRun: "2 weeks ago",
    totalRuns: 3,
    successRate: 100,
    gasUsed: "0.0025 FLOW",
  },
]

export function AgentCockpitWrapper() {
  const { user, authenticate } = useFlowCurrentUser()
  const { isDark } = useDarkMode()
  const { theme, toggleTheme } = useTheme()
  const {
    pauseAgent,
    resumeAgent,
    deleteAgent,
    isPausing,
    isResuming,
    isDeleting,
    pauseError,
    resumeError,
    deleteError,
  } = useAgentActions()
  
  // Payment agent hooks
  const { data: isHandlerInitialized, refetch: refetchHandlerStatus } = usePaymentHandlerStatus(user?.addr)
  const { mutateAsync: initializeHandler } = useInitializePaymentHandler()
  const { mutateAsync: schedulePayment } = useSchedulePaymentCron()
  
  // Initialize agents from cache
  const cachedAgents = useMemo(() => getCachedAgents(), [])
  const [agents, setAgents] = useState<Agent[]>(cachedAgents)
  const [completedAgents, setCompletedAgents] = useState<Agent[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const { toast } = useToast()

  const [onboardingStep, setOnboardingStep] = useState<"welcome" | "confirmation" | "success" | "complete">("complete")
  const [discoveredAgents, setDiscoveredAgents] = useState<DiscoveredAgent[]>([])
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)

  const [templateSidebarOpen, setTemplateSidebarOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [activeTxId, setActiveTxId] = useState<string | null>(null)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [hasRefreshedAfterTx, setHasRefreshedAfterTx] = useState(false)
  const [pendingAgentConfig, setPendingAgentConfig] = useState<any>(null)
  const [isInitializingHandler, setIsInitializingHandler] = useState(false)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)

  // Load agents on mount if user is logged in
  useEffect(() => {
    if (user?.loggedIn && user?.addr) {
      // Always load agents on mount - backend handles caching
      loadAgents(false)
    }
  }, [user?.loggedIn, user?.addr])

  const loadAgents = async (forceRefresh = false) => {
    if (!user?.addr) return
    
    setIsLoadingAgents(true)
    try {
      // Fetch agents from backend (single source of truth)
      const syncResult = await backendAPI.syncAgents(user?.addr, forceRefresh)
      
      // Helper function to map agent data
      const mapAgentData = (agent: any): Agent => {
        const lastRun = agent.lastExecutionAt 
          ? new Date(agent.lastExecutionAt).toLocaleString()
          : "Never"
        
        const totalRuns = agent.totalRuns ?? 0
        const successfulRuns = agent.successfulRuns ?? 0
        const successRate = totalRuns > 0 
          ? Math.round((successfulRuns / totalRuns) * 100)
          : 100
        
        // Extract contract name from handler contract (e.g., "A.address.ContractName" -> "ContractName")
        const extractContractName = (handlerContract: string) => {
          if (!handlerContract) return "Automated agent"
          const parts = handlerContract.split('.')
          return parts.length >= 3 ? parts[parts.length - 1] : handlerContract
        }
        
        // Format handler contract name for display
        const workflowSummary = agent.description || extractContractName(agent.handlerContract) || "Automated agent"
        
        // Map backend status to frontend status
        const mapStatus = (backendStatus: string, isActive: boolean): "active" | "paused" | "scheduled" | "stopped" | "error" | "completed" => {
          if (backendStatus === "failed") return "error"
          if (backendStatus === "cancelled" || backendStatus === "canceled") return "stopped"
          if (backendStatus === "completed" && !isActive) return "completed"
          if (backendStatus === "scheduled" && isActive) return "active"
          if (!isActive) return "paused"
          return "scheduled"
        }
        
        return {
          id: agent.id,
          name: agent.nickname || `Agent ${agent.scheduledTxId.slice(0, 8)}`,
          status: mapStatus(agent.status, agent.isActive),
          workflowSummary: workflowSummary,
          schedule: "Scheduled",
          nextRun: agent.status === 'completed' ? 'Completed' : (agent.scheduledAt ? new Date(agent.scheduledAt).toLocaleString() : "Unknown"),
          createdAt: agent.scheduledAt ? new Date(agent.scheduledAt).toLocaleDateString() : "Unknown",
          lastRun: lastRun,
          totalRuns: totalRuns,
          successRate: successRate,
          gasUsed: agent.fees || "0.001 FLOW",
          scheduledTxId: agent.scheduledTxId,
          handlerContract: agent.handlerContract,
          executionHistory: agent.executionHistory || []
        }
      }
      
      // Map active agents
      const mappedActiveAgents: Agent[] = (syncResult.data.agents || []).map(mapAgentData)
      
      // Map completed agents
      const mappedCompletedAgents: Agent[] = (syncResult.data.completedAgents || []).map(mapAgentData)
      
      setAgents(mappedActiveAgents)
      setCompletedAgents(mappedCompletedAgents)
      setCachedAgents(mappedActiveAgents)
      
      if (!forceRefresh) {
        toast({
          title: "Agents Loaded",
          description: `Found ${mappedActiveAgents.length} active and ${mappedCompletedAgents.length} completed agent${mappedActiveAgents.length + mappedCompletedAgents.length !== 1 ? 's' : ''}`,
        })
      }
    } catch (error) {
      console.error("Failed to load agents:", error)
      toast({
        title: "Error",
        description: "Failed to load agents from backend",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAgents(false)
    }
  }

  // Theme is now controlled by the theme context and FlowProvider's darkMode prop
  // The FlowProvider will automatically update all SDK components

  const handleConnectWallet = async () => {
    try {
      await authenticate()
      toast({
        title: "Wallet Connected",
        description: `Connected to ${user?.addr}`,
      })
    } catch (error) {
      console.error("Wallet connection error:", error)
      toast({
        title: "Connection Failed",
        description: "Could not connect wallet",
        variant: "destructive",
      })
    }
  }

  const handleWelcomeComplete = (discovered: DiscoveredAgent[]) => {
    setDiscoveredAgents(discovered)
    setOnboardingStep("confirmation")
  }

  const handleSkipOnboarding = () => {
    localStorage.setItem("flowpilot-onboarded", "true")
    setHasCompletedOnboarding(true)
    setOnboardingStep("complete")
    toast({
      title: "Onboarding Skipped",
      description: "You can manually add agents anytime",
    })
  }

  const handleConfirmationComplete = (agents: DiscoveredAgent[]) => {
    console.log("[v0] Creating manager with agents:", agents)
    setOnboardingStep("success")
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem("flowpilot-onboarded", "true")
    setHasCompletedOnboarding(true)
    setOnboardingStep("complete")
    toast({
      title: "Welcome to FlowPilot!",
      description: "Your Agent Manager is ready to use",
    })
  }

  const handleToggleStatus = async (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    if (!agent || !agent.scheduledTxId) return

    const isPausing = agent.status === "active" || agent.status === "scheduled"
    
    try {
      // Set up transaction tracking
      setTransactionDialogOpen(true)
      
      let txId: string
      if (isPausing) {
        txId = await pauseAgent(agentId, agent.scheduledTxId)
        setActiveTxId(txId)
        setHasRefreshedAfterTx(false)
      } else {
        txId = await resumeAgent(agentId, agent.scheduledTxId)
        setActiveTxId(txId)
        setHasRefreshedAfterTx(false)
      }

      // Update local state
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? { ...a, status: isPausing ? "paused" : (agent.status === "scheduled" ? "scheduled" : "active") }
            : a
        )
      )

      toast({
        title: "Success",
        description: `Agent ${isPausing ? "paused" : "resumed"} successfully`,
      })
    } catch (error: any) {
      console.error("Transaction error:", error)
      const { title, description } = handleFCLError(error)
      toast({
        title,
        description,
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (agentId: string) => {
    setSelectedAgentId(agentId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAgentId) return
    
    const agent = agents.find((a) => a.id === selectedAgentId)
    if (!agent || !agent.scheduledTxId) return

    try {
      // Set up transaction tracking
      setTransactionDialogOpen(true)
      
      const txId = await deleteAgent(selectedAgentId, agent.scheduledTxId)
      setActiveTxId(txId)
      setHasRefreshedAfterTx(false)

      setAgents((prev) => prev.filter((a) => a.id !== selectedAgentId))

      toast({
        title: "Agent Deleted",
        description: "Successfully deleted agent",
      })
    } catch (error: any) {
      console.error("Delete error:", error)
      const { title, description } = handleFCLError(error)
      toast({
        title,
        description,
        variant: "destructive",
      })
    } finally {
      setDeleteModalOpen(false)
      setSelectedAgentId(null)
    }
  }

  const handleBuildAgent = () => {
    setTemplateSidebarOpen(true)
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
  }

  const handleBackToTemplates = () => {
    setSelectedTemplateId(null)
  }

  const handleCloseSidebar = () => {
    setTemplateSidebarOpen(false)
    setSelectedTemplateId(null)
  }

  const handleCreateAgent = async (config: any) => {
    console.log("🎯 handleCreateAgent called with config:", config)
    
    if (!user?.addr) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    // Set loading state
    setIsCreatingAgent(true)

    try {
      // Force refetch handler status from blockchain before proceeding
      const result = await refetchHandlerStatus()
      const handlerExists = result.data
      const queryFailed = result.error || result.isError
      
      console.log("Handler status check:", { handlerExists, queryFailed, result })
      
      // Check if handler is initialized
      // If query failed, assume handler exists to avoid duplicate initialization
      if (handlerExists === false && !queryFailed) {
        // Store config for later use after initialization
        console.log("💾 Storing config in pendingAgentConfig:", config)
        setPendingAgentConfig(config)
        setIsInitializingHandler(true)
        
        toast({
          title: "Initializing Handler",
          description: "Setting up your payment handler...",
        })
        
        console.log("🔧 Sending handler initialization transaction...")
        console.log("📜 Init transaction cadence:", INIT_PAYMENT_HANDLER_TX)
        
        // Initialize handler first
        const initTxId = await initializeHandler({
          cadence: INIT_PAYMENT_HANDLER_TX,
          args: (arg, t) => [],
          limit: 9999,
        })
        
        console.log("✅ Init transaction submitted:", initTxId)
        
        setActiveTxId(initTxId)
        setHasRefreshedAfterTx(false)
        setTransactionDialogOpen(true)
        
        // Transaction dialog will handle the rest via onSuccess callback
        return
      }

      // Handler is initialized (or query failed, so we proceed), schedule the payment
      await schedulePaymentAgent(config)
      
    } catch (error: any) {
      console.error("Failed to create agent:", error)
      const { title, description } = handleFCLError(error)
      toast({
        title,
        description,
        variant: "destructive",
      })
      setIsInitializingHandler(false)
      setPendingAgentConfig(null)
      setIsCreatingAgent(false)
    }
  }

  const schedulePaymentAgent = async (config: any) => {
    console.log("📝 Scheduling payment with config:", config)
    
    // Validate config before submitting
    if (!config.destinationAddress || config.destinationAddress.trim() === '') {
      toast({
        title: "Invalid Configuration",
        description: "Destination address is required",
        variant: "destructive",
      })
      throw new Error("Destination address is required")
    }
    
    toast({
      title: "Scheduling Payment",
      description: "Creating your payment agent...",
    })

    const txId = await schedulePayment({
      cadence: SCHEDULE_PAYMENT_CRON_TX,
      args: (arg, t) => {
        console.log("🔧 Building transaction args:", {
          destinationAddress: config.destinationAddress,
          amount: config.amount,
          intervalSeconds: config.intervalSeconds,
          priority: config.priority,
          executionEffort: config.executionEffort,
          maxExecutions: config.maxExecutions,
          timestamp: config.timestamp,
        })
        
        return [
          arg(config.destinationAddress, t.Address),
          arg(config.amount.toFixed(8), t.UFix64),
          arg(config.intervalSeconds.toFixed(1), t.UFix64),
          arg(config.priority, t.UInt8),
          arg(config.executionEffort.toString(), t.UInt64),
          arg(config.maxExecutions, t.Optional(t.UInt64)),
          arg(config.timestamp === 0 ? null : config.timestamp.toFixed(1), t.Optional(t.UFix64)),
        ]
      },
      limit: 9999,
    })

    setActiveTxId(txId)
    setHasRefreshedAfterTx(false)
    setTransactionDialogOpen(true)
    
    handleCloseSidebar()
  }

  const handleManualImport = () => {
    setOnboardingStep("welcome")
  }

  const handleForceRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadAgents(true) // Force refresh
      toast({
        title: "Refreshed",
        description: "Agents list updated from blockchain",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh agents",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!user?.loggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold text-foreground">FlowPilot</h1>
            <p className="text-sm text-muted-foreground">Your on-chain automation hub</p>
          </div>
          <Button
            onClick={handleConnectWallet}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <OnboardingWelcome
        open={onboardingStep === "welcome"}
        onComplete={handleWelcomeComplete}
        onClose={() => setOnboardingStep("complete")}
      />
      <OnboardingConfirmation
        open={onboardingStep === "confirmation"}
        discoveredAgents={discoveredAgents}
        onConfirm={handleConfirmationComplete}
        onClose={() => setOnboardingStep("complete")}
      />
      <OnboardingSuccess 
        open={onboardingStep === "success"} 
        onComplete={handleOnboardingComplete}
        onClose={() => setOnboardingStep("complete")}
      />

      <AgentTemplatesSidebar
        open={templateSidebarOpen && !selectedTemplateId}
        onClose={handleCloseSidebar}
        onSelectTemplate={handleSelectTemplate}
      />
      <TemplateConfigPanel
        open={templateSidebarOpen && !!selectedTemplateId}
        templateId={selectedTemplateId || ""}
        onBack={handleBackToTemplates}
        onCreate={handleCreateAgent}
        isCreating={isCreatingAgent}
      />

      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/logo/Flowmatic_logotype.svg"
                alt="Flowmatic"
                width={200}
                height={60}
                className={`transition-colors ${theme === "dark" ? "brightness-0 invert" : "brightness-0"}`}
                priority
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleBuildAgent} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Build New Agent
              </Button>
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Connect 
                onConnect={() => {
                  toast({
                    title: "Wallet Connected",
                    description: "Successfully connected to Flow network",
                  })
                }}
                onDisconnect={() => {
                  toast({
                    title: "Wallet Disconnected",
                    description: "You have been logged out",
                  })
                }}
                variant="outline"
              />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          {isLoadingAgents && agents.length === 0 && completedAgents.length === 0 ? (
            <LoadingState />
          ) : agents.length === 0 && completedAgents.length === 0 ? (
            <EmptyState 
              onBuildAgent={handleBuildAgent}      // Primary button - will navigate to builder
              onImportAgent={handleManualImport}   // Secondary button - triggers import popup
            />
          ) : (
            <>
              {/* Show subtle loading indicator when refreshing */}
              {isLoadingAgents && (
                <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Syncing agents...</span>
                </div>
              )}
              
              {/* Active Agents Table */}
              {agents.length > 0 && (
                <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
                  {/* Table Header */}
                  <div className="px-6 py-3 bg-muted/30 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Active Agents</h2>
                    <p className="text-sm text-muted-foreground mt-1">These agents are currently executing transactions</p>

                  </div>
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                    <div className="col-span-3">Agent Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Workflow</div>
                    <div className="col-span-2">Schedule</div>
                    <div className="col-span-2">Next Run</div>
                  </div>

                  {/* Agent Rows */}
                  <div className="divide-y divide-border">
                    {agents.map((agent) => (
                      <AgentRow
                        key={agent.id}
                        agent={agent}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                    
                    {/* Manual Import Row */}
                    <button
                      onClick={handleManualImport}
                      className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors group"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        Import an agent manually
                      </span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Completed Agents Table */}
              {completedAgents.length > 0 && (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="px-6 py-3 bg-muted/30 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Completed Agents</h2>
                    <p className="text-sm text-muted-foreground mt-1">These agents have finished all scheduled executions</p>
                  </div>
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                    <div className="col-span-3">Agent Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Workflow</div>
                    <div className="col-span-2">Schedule</div>
                    <div className="col-span-2">Next Run</div>
                  </div>

                  {/* Completed Agent Rows */}
                  <div className="divide-y divide-border">
                    {completedAgents.map((agent) => (
                      <AgentRow
                        key={agent.id}
                        agent={agent}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <DeleteConfirmModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirm={handleDeleteConfirm}
          agentName={agents.find((a) => a.id === selectedAgentId)?.name || ""}
        />

        {/* Floating Refresh Button */}
        {user?.loggedIn && (
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-50"
            title="Refresh agents from blockchain"
          >
            <RefreshCw 
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} 
            />
          </button>
        )}

        <Toaster />

        {/* Transaction Status Dialog */}
        <TransactionDialog
          open={transactionDialogOpen}
          onOpenChange={setTransactionDialogOpen}
          txId={activeTxId || undefined}
          pendingTitle={isInitializingHandler ? "Initializing Payment Handler" : "Creating Payment Agent"}
          pendingDescription={isInitializingHandler 
            ? "Setting up your payment handler for the first time. This only needs to be done once."
            : "Scheduling your recurring payment agent on the Flow network"}
          successTitle={isInitializingHandler ? "Handler Initialized" : "Agent Created Successfully"}
          successDescription={isInitializingHandler 
            ? "Payment handler is ready. Now scheduling your payment agent..."
            : "Your payment agent is now active and will execute according to schedule"}
          closeOnSuccess={!isInitializingHandler}
          onSuccess={async () => {
            // Only refresh once per transaction
            if (!hasRefreshedAfterTx) {
              setHasRefreshedAfterTx(true)
              
              // If we just initialized the handler, proceed to schedule the pending agent
              if (isInitializingHandler && pendingAgentConfig) {
                // Wait for blockchain state to update, then retry with polling
                const pollHandlerStatus = async (retries = 5, delayMs = 1000) => {
                  for (let attempt = 0; attempt < retries; attempt++) {
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                    
                    const result = await refetchHandlerStatus()
                    const handlerExists = result.data
                    const queryFailed = result.error || result.isError
                    
                    console.log(`Post-init handler check (attempt ${attempt + 1}/${retries}):`, { handlerExists, queryFailed })
                    
                    if (handlerExists === true) {
                      // Handler is fully initialized with capabilities
                      console.log("✅ Handler ready! Proceeding with scheduling. pendingAgentConfig:", pendingAgentConfig)
                      
                      const configToSchedule = pendingAgentConfig
                      setPendingAgentConfig(null)
                      
                      // Show transition message
                      toast({
                        title: "Handler Ready!",
                        description: "Now scheduling your payment agent...",
                      })
                      
                      try {
                        await schedulePaymentAgent(configToSchedule)
                        // Keep isInitializingHandler true to prevent dialog from closing yet
                      } catch (error: any) {
                        console.error("Failed to schedule agent after initialization:", error)
                        const { title, description } = handleFCLError(error)
                        toast({
                          title,
                          description,
                          variant: "destructive",
                        })
                        setIsInitializingHandler(false)
                        setIsCreatingAgent(false)
                        setTransactionDialogOpen(false)
                      }
                      return
                    }
                    
                    // Not ready yet, increase delay for next attempt
                    delayMs *= 1.5
                  }
                  
                  // Max retries reached - show error
                  setIsInitializingHandler(false)
                  setPendingAgentConfig(null)
                  setIsCreatingAgent(false)
                  setTransactionDialogOpen(false)
                  toast({
                    title: "Initialization Timeout",
                    description: "Handler initialization is taking longer than expected. Please try creating the agent again in a moment.",
                    variant: "destructive",
                  })
                }
                
                // Start polling
                pollHandlerStatus()
              } else {
                // Regular transaction (schedule payment completed)
                // Reset all states
                setIsInitializingHandler(false)
                setIsCreatingAgent(false)
                
                // Wait longer for blockchain and API to sync before reloading
                toast({
                  title: "Agent Created!",
                  description: "Waiting for blockchain confirmation...",
                })
                
                setTimeout(async () => {
                  console.log("🔄 Reloading agents after blockchain sync delay...")
                  await loadAgents(true)
                  toast({
                    title: "Dashboard Updated",
                    description: "Your new agent is now visible",
                  })
                }, 8000) // 8 second delay for blockchain + API sync
              }
            }
          }}
        />
      </div>
    </>
  )
}
