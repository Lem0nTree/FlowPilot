"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

type OnboardingWelcomeProps = {
  open: boolean
  onComplete: (discoveredAgents: DiscoveredAgent[]) => void
  onClose: () => void
}

export type DiscoveredAgent = {
  id: string
  storagePath: string
  nickname: string
  description: string
}

export function OnboardingWelcome({ open, onComplete, onClose }: OnboardingWelcomeProps) {
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    if (open && isScanning) {
      // Simulate scanning for 3 seconds
      const timer = setTimeout(() => {
        setIsScanning(false)
        const discovered: DiscoveredAgent[] = [
          {
            id: "1",
            storagePath: "/storage/flowStaker_166558",
            nickname: "",
            description: "",
          },
          {
            id: "2",
            storagePath: "/storage/dcaBot_892341",
            nickname: "",
            description: "",
          },
        ]
        onComplete(discovered)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [open, isScanning, onComplete])

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Welcome to FlowPilot</h2>
            <p className="text-muted-foreground">Let's get you set up</p>
          </div>

          {/* Scanning Animation */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Pulsing circles animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/20 animate-ping" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/30 animate-pulse" />
            </div>
            <div className="relative">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Scanning for existing agents...</p>
            <p className="text-xs text-muted-foreground">Checking your recent activity since the Forte upgrade</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
