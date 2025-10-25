"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Package } from "lucide-react"
import type { DiscoveredAgent } from "./onboarding-welcome"

type OnboardingConfirmationProps = {
  open: boolean
  discoveredAgents: DiscoveredAgent[]
  onConfirm: (agents: DiscoveredAgent[]) => void
  onClose: () => void
}

export function OnboardingConfirmation({ open, discoveredAgents, onConfirm, onClose }: OnboardingConfirmationProps) {
  const [agents, setAgents] = useState<DiscoveredAgent[]>(discoveredAgents)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNicknameChange = (id: string, nickname: string) => {
    setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, nickname } : agent)))
  }

  const handleDescriptionChange = (id: string, description: string) => {
    setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, description } : agent)))
  }

  const handleAddManual = () => {
    const newAgent: DiscoveredAgent = {
      id: `manual-${Date.now()}`,
      storagePath: "",
      nickname: "",
      description: "",
    }
    setAgents((prev) => [...prev, newAgent])
  }

  const handleStoragePathChange = (id: string, storagePath: string) => {
    setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, storagePath } : agent)))
  }

  const handleRemove = (id: string) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== id))
  }

  const handleConfirm = () => {
    const hasInvalidAgents = agents.some((agent) => !agent.nickname.trim() || !agent.storagePath.trim())
    if (hasInvalidAgents) {
      return
    }

    setIsSubmitting(true)
    // Simulate transaction signing
    setTimeout(() => {
      onConfirm(agents)
    }, 2000)
  }

  const isValid = agents.every((agent) => agent.nickname.trim() && agent.storagePath.trim())

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            We found {discoveredAgents.length} {discoveredAgents.length === 1 ? "agent" : "agents"}!
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Give your agents meaningful names and descriptions to help you manage them.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Discovered Agents List */}
          {agents.map((agent, index) => {
            const isManual = agent.id.startsWith("manual-")
            const isDiscovered = !isManual

            return (
              <div
                key={agent.id}
                className="space-y-4 p-5 border border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {isDiscovered ? `Discovered Agent ${index + 1}` : "Manual Import"}
                    </span>
                  </div>
                  {isManual && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(agent.id)} className="h-8 text-xs">
                      Remove
                    </Button>
                  )}
                </div>

                {/* Storage Path - shown first for discovered, editable for manual */}
                <div className="space-y-2">
                  <Label htmlFor={`path-${agent.id}`} className="text-xs text-muted-foreground">
                    Storage Path {isManual && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={`path-${agent.id}`}
                    value={agent.storagePath}
                    onChange={(e) => handleStoragePathChange(agent.id, e.target.value)}
                    placeholder="/storage/myAgent"
                    disabled={isDiscovered}
                    className={isDiscovered ? "bg-muted font-mono text-sm" : "font-mono text-sm"}
                  />
                </div>

                {/* Nickname - required */}
                <div className="space-y-2">
                  <Label htmlFor={`nickname-${agent.id}`} className="text-xs text-muted-foreground">
                    Nickname <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`nickname-${agent.id}`}
                    value={agent.nickname}
                    onChange={(e) => handleNicknameChange(agent.id, e.target.value)}
                    placeholder="e.g., Weekly Staking Bot"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${agent.id}`} className="text-xs text-muted-foreground">
                    Description <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Textarea
                    id={`description-${agent.id}`}
                    value={agent.description}
                    onChange={(e) => handleDescriptionChange(agent.id, e.target.value)}
                    placeholder="e.g., Restakes my FLOW rewards every Friday"
                    className="text-sm resize-none"
                    rows={2}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Manual Add Section */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Did we miss any? You can import them manually.</p>
          <Button variant="outline" onClick={handleAddManual} className="w-full bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Import an Agent Manually
          </Button>
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || agents.length === 0 || !isValid}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering Agents...
              </>
            ) : (
              "Finish Setup"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
