import { createClient } from "@supabase/supabase-js"

const SUPA_URL = "https://ranhhacbgyfpzrjdynnd.supabase.co"
const SUPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmhoYWNiZ3lmcHpyamR5bm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MDU4OTEsImV4cCI6MjA1OTQ4MTg5MX0.Ey-X4Tz8krKHSICnYdHdBaI3q5WcRgUVwA8jOhfMr7Y"

export const supabase = createClient(SUPA_URL, SUPA_KEY)

export type User = {
  id: string
  email: string
  name?: string
}

export type AdminUser = {
  id: string
  email: string
  role: string
  created_at: string
}

export type Message = {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  timestamp: string
}

// Função para verificar se um usuário é administrador
export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("admin_users").select("*").eq("id", userId).single()

  if (error || !data) {
    return false
  }

  return true
}

// Função para criar um novo usuário
export async function createUser(email: string, name: string, userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .insert([{ id: userId, email, name }])
    .select()
    .single()

  if (error) {
    console.error("Erro ao criar usuário:", error)
    return null
  }

  return data
}

// Função para obter um usuário pelo ID
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("Erro ao buscar usuário:", error)
    return null
  }

  return data
}

// Função para salvar uma mensagem
export async function saveMessage(senderId: string, receiverId: string, content: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert([{ sender_id: senderId, receiver_id: receiverId, content }])
    .select()
    .single()

  if (error) {
    console.error("Erro ao salvar mensagem:", error)
    return null
  }

  return data
}

// Função para obter mensagens de um usuário
export async function getUserMessages(userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("timestamp", { ascending: false })

  if (error) {
    console.error("Erro ao buscar mensagens:", error)
    return []
  }

  return data || []
}

// Função para criar um usuário administrador
export async function createAdminUser(email: string): Promise<AdminUser | null> {
  const { data, error } = await supabase.from("admin_users").insert([{ email }]).select().single()

  if (error) {
    console.error("Erro ao criar admin:", error)
    return null
  }

  return data
}

// Função para obter todos os usuários (apenas para admins)
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Erro ao buscar usuários:", error)
    return []
  }

  return data || []
}
