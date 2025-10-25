"use client"

import { useState } from "react"
import { useFlowCurrentUser, useFlowAccount } from "@onflow/react-sdk"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Wallet, Copy, LogOut, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WalletPopover() {
  const { user, unauthenticate } = useFlowCurrentUser()
  const { data: account, isLoading } = useFlowAccount({ 
    address: user?.addr,
    query: { enabled: !!user?.addr }
  })
  const { toast } = useToast()
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  if (!user?.loggedIn || !user?.addr) {
    return null
  }

  // Calculate FLOW balance from atomic units
  const flowBalance = account ? (account.balance / 100000000).toFixed(2) : "0.00"
  const displayBalance = `${flowBalance} FLOW`

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(user?.addr || "")
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      await unauthenticate()
      toast({
        title: "Disconnected",
        description: "Wallet disconnected successfully",
      })
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Could not disconnect wallet",
        variant: "destructive",
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Wallet className="h-4 w-4" />
          {isLoading && (
            <Loader2 className="absolute -top-1 -right-1 h-3 w-3 animate-spin text-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Balance Display */}
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                displayBalance
              )}
            </div>
            <div className="text-sm text-muted-foreground">FLOW Balance</div>
          </div>

          {/* Address Section */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Wallet Address</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                {user?.addr}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
                className="shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Disconnect Button */}
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="w-full"
          >
            {isDisconnecting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Disconnecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </div>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
