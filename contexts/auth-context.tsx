"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type AuthUser = {
  id: string
  email: string
  name?: string
  isAdmin: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  createUserAccount: (email: string, password: string, name: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Verificar se um usuário é administrador
  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("admin_users").select("*").eq("id", userId).single()

      if (error || !data) {
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao verificar status de admin:", error)
      return false
    }
  }

  // Obter dados do usuário
  const getUserData = async (userId: string): Promise<{ name?: string } | null> => {
    try {
      const { data, error } = await supabase.from("app_users").select("name").eq("id", userId).single()

      if (error) {
        console.error("Erro ao buscar dados do usuário:", error)
        return null
      }

      return data || null
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error)
      return null
    }
  }

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { user: authUser } = session

        if (authUser) {
          const isAdminUser = await checkAdminStatus(authUser.id)
          const userData = await getUserData(authUser.id)

          setUser({
            id: authUser.id,
            email: authUser.email || "",
            name: userData?.name,
            isAdmin: isAdminUser,
          })
        }
      }

      setLoading(false)
    }

    checkSession()

    // Configurar listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const { user: authUser } = session

        if (authUser) {
          const isAdminUser = await checkAdminStatus(authUser.id)
          const userData = await getUserData(authUser.id)

          setUser({
            id: authUser.id,
            email: authUser.email || "",
            name: userData?.name,
            isAdmin: isAdminUser,
          })
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      return { error: error.message || "Erro ao fazer login" }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Inserir na tabela app_users
        const { error: userError } = await supabase.from("app_users").insert([
          {
            id: data.user.id,
            email,
            name,
          },
        ])

        if (userError) throw userError
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message || "Erro ao criar conta" }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Função para administradores criarem contas de usuário
  const createUserAccount = async (email: string, password: string, name: string) => {
    if (!user?.isAdmin) {
      return { error: "Apenas administradores podem criar contas" }
    }

    try {
      // Criar usuário no Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (error) throw error

      if (data.user) {
        // Inserir na tabela app_users
        const { error: userError } = await supabase.from("app_users").insert([
          {
            id: data.user.id,
            email,
            name,
          },
        ])

        if (userError) throw userError
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message || "Erro ao criar conta de usuário" }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, createUserAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
