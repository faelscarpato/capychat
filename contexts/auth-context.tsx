"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { initializeDatabase } from "@/lib/db-init"

type AuthUser = {
  id: string
  isAnonymous: boolean
}

interface AuthContextType {
  user: AuthUser
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Initialize database tables
        await initializeDatabase()

        // Check if we have a stored anonymous ID
        const storedId = localStorage.getItem("anonymousUserId")

        if (storedId) {
          // We have a stored ID, use it
          setUser({
            id: storedId,
            isAnonymous: true,
          })
          setLoading(false)
          return
        }

        // No stored ID, create a new anonymous user
        const newId = uuidv4()
        localStorage.setItem("anonymousUserId", newId)
        setUser({
          id: newId,
          isAnonymous: true,
        })
      } catch (error) {
        console.error("Auth initialization error:", error)
        // Fallback to local ID
        const fallbackId = localStorage.getItem("anonymousUserId") || uuidv4()
        localStorage.setItem("anonymousUserId", fallbackId)
        setUser({
          id: fallbackId,
          isAnonymous: true,
        })
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [])

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>
  }

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
