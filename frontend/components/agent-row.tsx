"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TransactionButton, TransactionLink } from "@onflow/react-sdk"
import { ChevronDown, ChevronUp, Play, Pause, MoreVertical, Trash2, Edit, ExternalLink } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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

type AgentRowProps = {
  agent: Agent
  onToggleStatus: (agentId: string) => void
  onDelete: (agentId: string) => void
}

export function AgentRow({ agent, onToggleStatus, onDelete }: AgentRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="hover:bg-muted/30 transition-colors">
      {/* Main Row */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
        {/* Agent Name */}
        <div className="col-span-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <span className="font-medium text-foreground truncate">{agent.name}</span>
        </div>

        {/* Status */}
        <div className="col-span-2 flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              agent.status === "active" ? "bg-primary animate-pulse" : 
              agent.status === "scheduled" ? "bg-blue-500 animate-pulse" : 
              "bg-muted-foreground",
            )}
          />
          <span className="text-sm capitalize text-foreground">{agent.status}</span>
        </div>

        {/* Workflow */}
        <div className="col-span-3">
          <span className="text-sm text-muted-foreground truncate">{agent.workflowSummary}</span>
        </div>

        {/* Schedule */}
        <div className="col-span-2">
          <span className="text-sm text-muted-foreground">{agent.schedule}</span>
        </div>

        {/* Next Run */}
        <div className="col-span-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{agent.nextRun}</span>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <TransactionButton
              transaction={{
                cadence: agent.status === "active" || agent.status === "scheduled" 
                  ? `import FlowTransactionScheduler from 0xFlowTransactionScheduler
                     transaction(scheduledTxId: String) {
                       prepare(signer: auth(Storage) &Account) {
                         let scheduler = FlowTransactionScheduler.getScheduler()
                         scheduler.cancel(id: scheduledTxId)
                       }
                     }`
                  : `import FlowTransactionScheduler from 0xFlowTransactionScheduler
                     transaction(scheduledTxId: String) {
                       prepare(signer: auth(Storage) &Account) {
                         // Resume logic here
                       }
                     }`,
                args: (arg, t) => [arg(agent.scheduledTxId || "", t.String)],
                limit: 9999,
              }}
              label={agent.status === "active" || agent.status === "scheduled" ? "Pause" : "Resume"}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={
                agent.status === "active" ? "Pause agent" : 
                agent.status === "scheduled" ? "Pause agent" : 
                "Resume agent"
              }
              mutation={{
                onSuccess: () => onToggleStatus(agent.id),
                onError: (error) => console.error("Transaction failed:", error)
              }}
            >
              {agent.status === "active" || agent.status === "scheduled" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </TransactionButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Agent
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(agent.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-6 pb-4 pt-2 border-t border-border bg-muted/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 ml-9">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium text-foreground">{agent.createdAt}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Last Run</p>
              <p className="text-sm font-medium text-foreground">{agent.lastRun}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Runs</p>
              <p className="text-sm font-medium text-foreground">{agent.totalRuns}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="text-sm font-medium text-primary">{agent.successRate}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Avg Gas Used</p>
              <p className="text-sm font-medium text-foreground">{agent.gasUsed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Workflow Details</p>
              <p className="text-sm font-medium text-foreground">{agent.workflowSummary}</p>
            </div>
            {agent.scheduledTxId && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Transaction</p>
                <TransactionLink 
                  txId={agent.scheduledTxId}
                  variant="link"
                  className="text-xs text-primary hover:text-primary/80"
                >
                  <ExternalLink className="mr-1 h-3 w-3 inline" />
                  View on Explorer
                </TransactionLink>
              </div>
            )}
          </div>

          {/* Action Buttons in Expanded View */}
          <div className="flex gap-2 mt-4 ml-9">
            <Button size="sm" variant="outline">
              View Logs
            </Button>
            <Button size="sm" variant="outline">
              Edit Workflow
            </Button>
            <Button size="sm" variant="outline">
              Run Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
