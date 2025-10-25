"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search, Zap, TrendingUp, ImageIcon, Sprout, ArrowRightLeft, Code, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Template = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  available: boolean
}

const templates: Template[] = [
  {
    id: "automatic-payment",
    title: "Automatic Payment",
    description: "Schedule recurring payments to any address",
    icon: <Zap className="h-5 w-5" />,
    available: true,
  },
  {
    id: "dca-buy",
    title: "DCA Buy",
    description: "Dollar-cost average into tokens over time",
    icon: <TrendingUp className="h-5 w-5" />,
    available: false,
  },
  {
    id: "nft-floor-sweep",
    title: "NFT Floor Sweep",
    description: "Automatically buy NFTs at floor price",
    icon: <ImageIcon className="h-5 w-5" />,
    available: false,
  },
  {
    id: "farm-compound",
    title: "Farm Compound",
    description: "Auto-compound your farming rewards",
    icon: <Sprout className="h-5 w-5" />,
    available: false,
  },
  {
    id: "scheduled-bridge",
    title: "Scheduled Bridge",
    description: "Bridge assets on a schedule",
    icon: <ArrowRightLeft className="h-5 w-5" />,
    available: false,
  },
  {
    id: "custom-function",
    title: "Custom Function Trigger",
    description: "Execute custom smart contract functions",
    icon: <Code className="h-5 w-5" />,
    available: false,
  },
]

interface AgentTemplatesSidebarProps {
  open: boolean
  onClose: () => void
  onSelectTemplate: (templateId: string) => void
}

export function AgentTemplatesSidebar({ open, onClose, onSelectTemplate }: AgentTemplatesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-card border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Agent Templates</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => template.available && onSelectTemplate(template.id)}
                disabled={!template.available}
                className={`w-full flex items-start gap-4 p-4 rounded-lg border border-border transition-all ${
                  template.available
                    ? "hover:bg-muted/50 hover:border-muted-foreground/20 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    template.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {template.icon}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{template.title}</h3>
                    {!template.available && (
                      <Badge variant="secondary" className="text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>

                {/* Arrow */}
                {template.available && <ChevronRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" />}
              </button>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No templates found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
