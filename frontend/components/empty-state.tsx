"use client"

import { Button } from "@/components/ui/button"
import { Plus, Zap } from "lucide-react"

type EmptyStateProps = {
  onBuildAgent: () => void      // Will navigate to builder page
  onImportAgent: () => void      // Will trigger import popup
}

export function EmptyState({ onBuildAgent, onImportAgent }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Welcome to Flowmatic</h2>
          <p className="text-muted-foreground text-balance">
            Your on-chain automation hub. Create your first Agent to automate blockchain tasks like token swaps,
            staking, and NFT minting.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Primary action - Build agent (will navigate to builder) */}
          <Button 
            onClick={onBuildAgent} 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Build Your First Agent
          </Button>
          
          {/* Secondary action - Import existing agent */}
          <Button 
            onClick={onImportAgent} 
            size="lg" 
            variant="secondary"
          >
            <Plus className="mr-2 h-5 w-5" />
            Import an agent manually
          </Button>
        </div>
      </div>
    </div>
  )
}
