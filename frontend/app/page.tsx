"use client"

import { useState, useEffect } from "react"
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
import { Wallet, Plus, Sun, Moon } from "lucide-react"

type Agent = {
  id: string
  name: string
  status: "active" | "paused"
  workflowSummary: string
  schedule: string
  nextRun: string
  createdAt: string
  lastRun: string
  totalRuns: number
  successRate: number
  gasUsed: string
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
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [isConnected, setIsConnected] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [agents, setAgents] = useState<Agent[]>(mockAgents)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const { toast } = useToast()

  const [onboardingStep, setOnboardingStep] = useState<"welcome" | "confirmation" | "success" | "complete">("complete")
  const [discoveredAgents, setDiscoveredAgents] = useState<DiscoveredAgent[]>([])
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)

  // Simulate first-time user detection
  useEffect(() => {
    const hasOnboarded = localStorage.getItem("flowpilot-onboarded")
    if (!hasOnboarded && isConnected) {
      setHasCompletedOnboarding(false)
      setOnboardingStep("welcome")
    }
  }, [isConnected])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  if (typeof window !== "undefined" && !document.documentElement.classList.contains("dark")) {
    document.documentElement.classList.add("dark")
  }

  const handleConnectWallet = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsConnected(true)
      setIsLoading(false)
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Flow blockchain",
      })
    }, 1500)
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

  const handleToggleStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              status: agent.status === "active" ? "paused" : "active",
              nextRun: agent.status === "active" ? "Paused" : "In 3 days, 4 hours",
            }
          : agent,
      ),
    )
    const agent = agents.find((a) => a.id === agentId)
    toast({
      title: agent?.status === "active" ? "Agent Paused" : "Agent Resumed",
      description: `${agent?.name} has been ${agent?.status === "active" ? "paused" : "resumed"}`,
    })
  }

  const handleDeleteClick = (agentId: string) => {
    setSelectedAgentId(agentId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedAgentId) {
      const agent = agents.find((a) => a.id === selectedAgentId)
      setAgents((prev) => prev.filter((a) => a.id !== selectedAgentId))
      toast({
        title: "Agent Deleted",
        description: `${agent?.name} has been permanently deleted`,
        variant: "destructive",
      })
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

  if (!isConnected) {
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
        onClose={handleSkipOnboarding}
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
          {isLoading ? (
            <LoadingState />
          ) : agents.length === 0 ? (
            <EmptyState onBuildAgent={handleBuildAgent} />
          ) : (
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
              </div>
            </div>
          )}
        </main>

        <DeleteConfirmModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          onConfirm={handleDeleteConfirm}
          agentName={agents.find((a) => a.id === selectedAgentId)?.name || ""}
        />

        <Toaster />
      </div>
    </>
  )
}
