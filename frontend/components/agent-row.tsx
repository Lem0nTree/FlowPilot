"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Play, Pause, MoreVertical, Trash2, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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
              agent.status === "active" ? "bg-primary animate-pulse" : "bg-muted-foreground",
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleStatus(agent.id)}
              title={agent.status === "active" ? "Pause agent" : "Resume agent"}
            >
              {agent.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
              <p className="text-sm font-medium text-foreground">{agent.workflowSummary}</p>
            </div>
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
