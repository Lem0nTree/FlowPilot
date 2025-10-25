"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usersApi } from '@/lib/api/users'
import { config } from '@/lib/config'
import type { User } from '@/lib/api/types'

interface WalletContextType {
  isConnected: boolean
  isLoading: boolean
  user: User | null
  userAddress: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  error: string | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      const savedAddress = localStorage.getItem(config.app.walletKey)
      if (savedAddress) {
        setUserAddress(savedAddress)
        setIsConnected(true)
        
        // Try to fetch user data
        try {
          const result = await usersApi.getUserByAddress(savedAddress)
          if (result.success) {
            setUser(result.data.user)
          }
        } catch (err) {
          console.warn('Failed to fetch user data:', err)
        }
      }
    }

    checkExistingConnection()
  }, [])

  const connectWallet = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate wallet connection (replace with actual FCL integration)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For now, use a mock address - in production this would come from FCL
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 40)
      
      setUserAddress(mockAddress)
      setIsConnected(true)
      localStorage.setItem(config.app.walletKey, mockAddress)

      // Create or get user in backend
      const result = await usersApi.createOrGetUser(mockAddress, 'User', undefined)
      if (result.success) {
        setUser(result.data.user)
      } else {
        throw new Error(result.message || 'Failed to create user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
      setIsConnected(false)
      setUserAddress(null)
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setUser(null)
    setUserAddress(null)
    setError(null)
    localStorage.removeItem(config.app.walletKey)
  }

  const value: WalletContextType = {
    isConnected,
    isLoading,
    user,
    userAddress,
    connectWallet,
    disconnectWallet,
    error
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
