"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type OnboardingSuccessProps = {
  open: boolean
  onComplete: () => void
}

export function OnboardingSuccess({ open, onComplete }: OnboardingSuccessProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/20 animate-pulse" />
            </div>
            <CheckCircle2 className="relative h-16 w-16 text-primary" />
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Setup Complete!</h2>
            <p className="text-muted-foreground">Your Agent Manager has been created successfully</p>
          </div>

          {/* Continue Button */}
          <Button onClick={onComplete} className="bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
            Go to Agent Cockpit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
