"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase"

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
        // Check if we have a session
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData.session) {
          // We have a session, use the authenticated user
          setUser({
            id: sessionData.session.user.id,
            isAnonymous: false,
          })
          setLoading(false)
          return
        }

        // No session, check for stored anonymous ID
        const storedId = localStorage.getItem("anonymousUserId")

        if (storedId) {
          // We have a stored ID, sign in anonymously with it
          const { data, error } = await supabase.auth.signInWithPassword({
            email: `${storedId}@anonymous.user`,
            password: storedId,
          })

          if (!error && data.user) {
            setUser({
              id: data.user.id,
              isAnonymous: true,
            })
            setLoading(false)
            return
          }
        }

        // No stored ID or sign-in failed, create a new anonymous user
        const newId = uuidv4()

        // Create anonymous user in Supabase
        const { data, error } = await supabase.auth.signUp({
          email: `${newId}@anonymous.user`,
          password: newId,
        })

        if (error) {
          console.error("Error creating anonymous user:", error)
          // Fallback to local-only
          localStorage.setItem("anonymousUserId", newId)
          setUser({
            id: newId,
            isAnonymous: true,
          })
        } else if (data.user) {
          localStorage.setItem("anonymousUserId", newId)
          setUser({
            id: data.user.id,
            isAnonymous: true,
          })
        }
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
