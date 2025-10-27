"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TransactionButton } from "@onflow/react-sdk"
import { ChevronDown, ChevronUp, Play, Pause, MoreVertical, Trash2, Edit, ExternalLink, Clock } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type Agent = {
  id: string
  name: string
  status: "active" | "paused" | "scheduled" | "stopped" | "error"
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
  executionHistory?: Array<{
    scheduledTxId: string
    completedTxId: string
    status: string
    scheduledAt: string
    completedAt: string
    fees: string
    error?: string
  }>
}

type AgentRowProps = {
  agent: Agent
  onToggleStatus: (agentId: string) => void
  onDelete: (agentId: string) => void
}

export function AgentRow({ agent, onToggleStatus, onDelete }: AgentRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  
  // Get status color and label
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "scheduled":
      case "active":
        return { color: "bg-green-500", label: "Active", animate: true }
      case "paused":
        return { color: "bg-blue-500", label: "Paused", animate: false }
      case "stopped":
      case "cancelled":
      case "canceled":
        return { color: "bg-yellow-500", label: "Stopped", animate: false }
      case "failed":
      case "error":
        return { color: "bg-red-500", label: "Error", animate: false }
      default:
        return { color: "bg-muted-foreground", label: status, animate: false }
    }
  }
  
  const statusConfig = getStatusConfig(agent.status)
  
  // Build contract explorer URL
  const getContractExplorerUrl = () => {
    if (!agent.handlerContract) return null
    return `https://testnet.flowscan.io/contract/${agent.handlerContract}?tab=deployments`
  }
  
  // Build transaction explorer URL
  const getTransactionExplorerUrl = (txId: string) => {
    return `https://testnet.flowscan.io/transaction/${txId}`
  }
  
  // Calculate schedule interval from execution history
  const calculateScheduleInterval = (): string => {
    if (!agent.executionHistory || agent.executionHistory.length < 2) {
      return agent.schedule || "Unknown"
    }
    
    // Get the two most recent executions to calculate interval
    const executions = agent.executionHistory
      .filter(ex => ex.completedAt)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    
    if (executions.length < 2) {
      return agent.schedule || "Unknown"
    }
    
    // Calculate difference in seconds between most recent two executions
    const time1 = new Date(executions[0].completedAt).getTime()
    const time2 = new Date(executions[1].completedAt).getTime()
    const diffSeconds = Math.abs(time1 - time2) / 1000
    
    // Format based on the best unit
    if (diffSeconds < 60) {
      return `Every ${Math.round(diffSeconds)} seconds`
    } else if (diffSeconds < 3600) {
      const minutes = Math.round(diffSeconds / 60)
      return `Every ${minutes} minute${minutes !== 1 ? 's' : ''}`
    } else if (diffSeconds < 86400) {
      const hours = Math.round(diffSeconds / 3600)
      return `Every ${hours} hour${hours !== 1 ? 's' : ''}`
    } else if (diffSeconds < 604800) {
      const days = Math.round(diffSeconds / 86400)
      return `Every ${days} day${days !== 1 ? 's' : ''}`
    } else {
      const weeks = Math.round(diffSeconds / 604800)
      return `Every ${weeks} week${weeks !== 1 ? 's' : ''}`
    }
  }

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
              statusConfig.color,
              statusConfig.animate && "animate-pulse"
            )}
          />
          <span className="text-sm text-foreground">{statusConfig.label}</span>
        </div>

        {/* Workflow */}
        <div className="col-span-3">
          <span className="text-sm text-muted-foreground truncate">{agent.workflowSummary}</span>
        </div>

        {/* Schedule */}
        <div className="col-span-2">
          <span className="text-sm text-muted-foreground">{calculateScheduleInterval()}</span>
        </div>

        {/* Next Run */}
        <div className="col-span-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{agent.nextRun}</span>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onToggleStatus(agent.id)}
              title={
                agent.status === "active" ? "Pause agent" : 
                agent.status === "scheduled" ? "Pause agent" : 
                "Resume agent"
              }
            >
              {agent.status === "active" || agent.status === "scheduled" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

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
              {getContractExplorerUrl() ? (
                <a 
                  href={getContractExplorerUrl()!} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-muted-foreground inline-flex items-center gap-1"
                >
                  {agent.workflowSummary}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-sm font-medium text-foreground">{agent.workflowSummary}</p>
              )}
            </div>
            {agent.scheduledTxId && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Transaction</p>
                <a 
                  href={getTransactionExplorerUrl(agent.scheduledTxId)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-muted-foreground inline-flex items-center gap-1"
                >
                  View on Block Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons in Expanded View */}
          <div className="flex gap-2 mt-4 ml-9">
            <Button size="sm" variant="outline" onClick={() => setShowLogs(true)}>
              <Clock className="mr-2 h-4 w-4" />
              View Logs
            </Button>
            <Button size="sm" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Workflow
            </Button>
            <Button size="sm" variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Run Now
            </Button>
          </div>
        </div>
      )}
      
      {/* Execution Logs Dialog */}
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="sm:max-w-xl max-w-[95vw] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Execution History - {agent.name}</DialogTitle>
            <DialogDescription>
              View detailed execution logs and transaction history for this agent
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            {agent.executionHistory && agent.executionHistory.length > 0 ? (
              <div className="space-y-3">
                {agent.executionHistory.map((execution, index) => (
                  <div 
                    key={execution.scheduledTxId} 
                    className="border border-border rounded-lg p-4 bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Run #{agent.totalRuns - index}</span>
                        <span 
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            execution.status === "executed" ? "bg-green-500/10 text-green-500" :
                            execution.status === "failed" ? "bg-red-500/10 text-red-500" :
                            "bg-muted text-muted-foreground"
                          )}
                        >
                          {execution.status}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(execution.completedAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Scheduled At</p>
                        <p className="font-mono text-xs">{new Date(execution.scheduledAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Completed At</p>
                        <p className="font-mono text-xs">{new Date(execution.completedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                        <a 
                          href={getTransactionExplorerUrl(execution.completedTxId)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-foreground hover:text-muted-foreground inline-flex items-center gap-1 font-mono"
                        >
                          {execution.completedTxId.slice(0, 8)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Gas Fee</p>
                        <p className="font-mono text-xs">{execution.fees} FLOW</p>
                      </div>
                    </div>
                    
                    {execution.error && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
                        <p className="font-medium text-red-500 mb-1">Error:</p>
                        <p className="text-red-400 font-mono whitespace-pre-wrap">{execution.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No execution history available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Execution logs will appear here once the agent runs
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
