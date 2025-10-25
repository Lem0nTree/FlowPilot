"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import * as fcl from "@onflow/fcl"
import { configureFlowClient } from "./config"

interface FlowUser {
  addr: string | null
  loggedIn: boolean
}

interface FlowContextType {
  user: FlowUser
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const FlowContext = createContext<FlowContextType | undefined>(undefined)

export function FlowProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FlowUser>({ addr: null, loggedIn: false })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    configureFlowClient()
    
    // Subscribe to FCL authentication state changes
    const unsubscribe = fcl.currentUser.subscribe((currentUser: any) => {
      setUser({
        addr: currentUser.addr || null,
        loggedIn: currentUser.loggedIn || false,
      })
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const connect = async () => {
    setIsLoading(true)
    try {
      await fcl.authenticate()
    } catch (error) {
      console.error("Wallet connection error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    await fcl.unauthenticate()
  }

  return (
    <FlowContext.Provider value={{ user, isLoading, connect, disconnect }}>
      {children}
    </FlowContext.Provider>
  )
}

export const useFlow = () => {
  const context = useContext(FlowContext)
  if (!context) {
    throw new Error("useFlow must be used within FlowProvider")
  }
  return context
}
