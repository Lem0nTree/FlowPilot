"use client"

import dynamic from "next/dynamic"

// Dynamically import the component to prevent SSR issues with Flow hooks
const AgentCockpitWrapper = dynamic(
  () => import("@/components/agent-cockpit-wrapper").then((mod) => ({ default: mod.AgentCockpitWrapper })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading FlowPilot...</p>
        </div>
      </div>
    )
  }
)

export default function AgentCockpit() {
  return <AgentCockpitWrapper />
}
