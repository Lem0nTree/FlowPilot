"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, MoreVertical, Pause, Play, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Agent = {
  id: string
  name: string
  status: "active" | "paused"
  workflowSummary: string
  schedule: string
  nextRun: string
}

type AgentCardProps = {
  agent: Agent
  onToggleStatus: (agentId: string) => void
  onDelete: (agentId: string) => void
}

export function AgentCard({ agent, onToggleStatus, onDelete }: AgentCardProps) {
  const [isPending, setIsPending] = useState(false)

  const handleToggle = async () => {
    setIsPending(true)
    // Simulate transaction signing
    setTimeout(() => {
      onToggleStatus(agent.id)
      setIsPending(false)
    }, 1000)
  }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <h3 className="text-lg font-semibold text-foreground text-balance">{agent.name}</h3>
            <div className="flex items-center gap-2">
              <div
                className={cn("h-2 w-2 rounded-full", agent.status === "active" ? "bg-primary" : "bg-muted-foreground")}
              />
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wide",
                  agent.status === "active" ? "text-primary" : "text-muted-foreground",
                )}
              >
                {agent.status}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(agent.id)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-sm text-card-foreground/90">
          {agent.workflowSummary.split(" ").map((word, i) => {
            // Highlight numbers and token names
            if (/^\d+\.?\d*$/.test(word) || ["FUSD", "FLOW", "ExampleNFT"].includes(word)) {
              return (
                <span key={i} className="font-medium text-foreground">
                  {word}{" "}
                </span>
              )
            }
            return <span key={i}>{word} </span>
          })}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3 border-t border-border">
        <div className="flex items-start gap-2 w-full text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <p>{agent.schedule}</p>
            <p className="font-medium">{agent.nextRun}</p>
          </div>
        </div>

        <Button
          onClick={handleToggle}
          disabled={isPending}
          variant="outline"
          className={cn(
            "w-full",
            agent.status === "paused" && "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {isPending ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : agent.status === "active" ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
