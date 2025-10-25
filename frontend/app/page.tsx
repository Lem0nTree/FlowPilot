"use client"

import { useState, useEffect, useMemo } from "react"
import { useFlow } from "@/lib/flow/FlowProvider"
import { backendAPI, type Agent as BackendAgent } from "@/lib/api/client"
import { transactionService } from "@/lib/flow/transaction-service"
import { handleFCLError } from "@/lib/flow/error-handler"
import { AgentRow } from "@/components/agent-row"
import { EmptyState } from "@/components/empty-state"
import { LoadingState } from "@/components/loading-state"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { OnboardingWelcome, type DiscoveredAgent } from "@/components/onboarding-welcome"
import { OnboardingConfirmation } from "@/components/onboarding-confirmation"
import { OnboardingSuccess } from "@/components/onboarding-success"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Wallet, Plus, Sun, Moon, RefreshCw, Loader2 } from "lucide-react"

type Agent = {
  id: string
  name: string
  status: "active" | "paused" | "scheduled"
  workflowSummary: string
  schedule: string
  nextRun: string
  createdAt: string
  lastRun: string
  totalRuns: number
  successRate: number
  gasUsed: string
  scheduledTxId?: string
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

export default function AgentCockpit() {
  const { user, isLoading: isConnecting, connect } = useFlow()
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  
  // Initialize agents from cache
  const cachedAgents = useMemo(() => getCachedAgents(), [])
  const [agents, setAgents] = useState<Agent[]>(cachedAgents)
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const { toast } = useToast()

  const [onboardingStep, setOnboardingStep] = useState<"welcome" | "confirmation" | "success" | "complete">("complete")
  const [discoveredAgents, setDiscoveredAgents] = useState<DiscoveredAgent[]>([])
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)

  // Load agents on mount if user is logged in
  useEffect(() => {
    if (user.loggedIn && user.addr) {
      // Only fetch if cache is empty or stale (older than 5 minutes)
      const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      const isStale = !cacheTimestamp || 
        (Date.now() - parseInt(cacheTimestamp)) > 5 * 60 * 1000
      
      if (cachedAgents.length === 0 || isStale) {
        loadAgents(false)
      }
    }
  }, [user.loggedIn, user.addr, cachedAgents.length])

  const loadAgents = async (forceRefresh = false) => {
    if (!user.addr) return
    
    setIsLoadingAgents(true)
    try {
      // Smart Scan via backend - discovers agents and stores in DB
      const syncResult = await backendAPI.syncAgents(user.addr, forceRefresh)
      
      // Map backend agents to frontend format
      const mappedAgents: Agent[] = syncResult.data.agents.map(agent => ({
        id: agent.id,
        name: agent.nickname || `Agent ${agent.id.slice(0, 8)}`,
        status: agent.status === "scheduled" ? "active" : agent.status as "active" | "paused",
        workflowSummary: agent.description || "Automated agent",
        schedule: "Scheduled", // This would come from agent data
        nextRun: agent.scheduledAt ? new Date(agent.scheduledAt).toLocaleString() : "Unknown",
        createdAt: agent.scheduledAt ? new Date(agent.scheduledAt).toLocaleDateString() : "Unknown",
        lastRun: "Unknown", // This would come from agent execution history
        totalRuns: 0, // This would come from agent execution history
        successRate: 100, // This would come from agent execution history
        gasUsed: "0.001 FLOW", // This would come from agent execution history
        scheduledTxId: agent.scheduledTxId,
      }))
      
      setAgents(mappedAgents)
      setCachedAgents(mappedAgents) // Update cache
      
      toast({
        title: "Agents Loaded",
        description: `Found ${mappedAgents.length} agents`,
      })
    } catch (error) {
      console.error("Failed to load agents:", error)
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAgents(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  if (typeof window !== "undefined" && !document.documentElement.classList.contains("dark")) {
    document.documentElement.classList.add("dark")
  }

  const handleConnectWallet = async () => {
    try {
      await connect()
      toast({
        title: "Wallet Connected",
        description: `Connected to ${user.addr}`,
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

    try {
      const isPausing = agent.status === "active" || agent.status === "scheduled"
      
      // Execute transaction via FCL and sync with backend
      const txId = isPausing
        ? await transactionService.pauseAgent(agentId, agent.scheduledTxId)
        : await transactionService.resumeAgent(agentId, agent.scheduledTxId)

      // Update local state
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? { ...a, status: isPausing ? "paused" : "active" }
            : a
        )
      )

      toast({
        title: "Success",
        description: `Agent ${isPausing ? "paused" : "resumed"} (Tx: ${txId.slice(0, 8)}...)`,
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
      const txId = await transactionService.deleteAgent(
        selectedAgentId,
        agent.scheduledTxId
      )

      setAgents((prev) => prev.filter((a) => a.id !== selectedAgentId))

      toast({
        title: "Agent Deleted",
        description: `Successfully deleted agent (Tx: ${txId.slice(0, 8)}...)`,
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
    toast({
      title: "Coming Soon",
      description: "Agent builder will be available soon",
    })
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

  if (!user.loggedIn) {
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
      />
      <OnboardingSuccess open={onboardingStep === "success"} onComplete={handleOnboardingComplete} />

      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">Agent Cockpit</h1>
              <p className="text-sm text-muted-foreground">Manage your on-chain automations</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleBuildAgent} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Build New Agent
              </Button>
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon">
                <Wallet className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          {isLoadingAgents && agents.length === 0 ? (
            <LoadingState />
          ) : agents.length === 0 ? (
            <EmptyState onBuildAgent={handleManualImport} />
          ) : (
            <>
              {/* Show subtle loading indicator when refreshing */}
              {isLoadingAgents && (
                <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Syncing agents...</span>
                </div>
              )}
              
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Table Header */}
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
        {user.loggedIn && (
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
      </div>
    </>
  )
}
