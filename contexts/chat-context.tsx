"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./auth-context"

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: Date
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  personalityId: string
  createdAt: Date
  updatedAt: Date
}

interface ChatContextType {
  chats: Chat[]
  activeChat: Chat | null
  createChat: (personalityId: string, firstMessage?: string) => Promise<string>
  updateChatTitle: (chatId: string, title: string) => Promise<void>
  deleteChat: (chatId: string) => Promise<void>
  setActiveChat: (chatId: string | null) => void
  addMessage: (chatId: string, message: Omit<Message, "id" | "createdAt">) => Promise<void>
  clearChats: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChatState] = useState<Chat | null>(null)
  const { user } = useAuth()

  // Carregar chats do Supabase
  useEffect(() => {
    const loadChats = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("chat_conversations")
          .select("*, chat_messages(*)")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (error) {
          console.error("Erro ao carregar chats:", error)
          return
        }

        if (data) {
          const formattedChats = data.map((chat: any) => ({
            id: chat.id,
            title: chat.title,
            personalityId: chat.personality_id,
            createdAt: new Date(chat.created_at),
            updatedAt: new Date(chat.updated_at),
            messages: chat.chat_messages
              .map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: new Date(msg.created_at),
              }))
              .sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime()),
          }))

          setChats(formattedChats)

          // Restaurar chat ativo do localStorage
          const activeId = localStorage.getItem("activeChat")
          if (activeId) {
            const active = formattedChats.find((c: Chat) => c.id === activeId)
            if (active) {
              setActiveChatState(active)
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar chats:", error)
      }
    }

    if (user) {
      loadChats()
    } else {
      setChats([])
      setActiveChatState(null)
    }
  }, [user])

  // Salvar chat ativo no localStorage
  useEffect(() => {
    if (activeChat) {
      localStorage.setItem("activeChat", activeChat.id)
    } else {
      localStorage.removeItem("activeChat")
    }
  }, [activeChat])

  const createChat = async (personalityId: string, firstMessage?: string) => {
    if (!user) throw new Error("Usuário não autenticado")

    const newChatId = uuidv4()
    const now = new Date()

    try {
      // Criar chat no Supabase
      const { error: chatError } = await supabase.from("chat_conversations").insert([
        {
          id: newChatId,
          title: firstMessage ? generateTitle(firstMessage) : "Nova conversa",
          personality_id: personalityId,
          user_id: user.id,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ])

      if (chatError) throw chatError

      const initialMessages: Message[] = []

      // Se houver primeira mensagem, adicionar ao chat
      if (firstMessage) {
        const messageId = uuidv4()

        const { error: msgError } = await supabase.from("chat_messages").insert([
          {
            id: messageId,
            chat_id: newChatId,
            role: "user",
            content: firstMessage,
            created_at: now.toISOString(),
          },
        ])

        if (msgError) throw msgError

        initialMessages.push({
          id: messageId,
          role: "user",
          content: firstMessage,
          createdAt: now,
        })
      }

      const newChat: Chat = {
        id: newChatId,
        title: firstMessage ? generateTitle(firstMessage) : "Nova conversa",
        messages: initialMessages,
        personalityId,
        createdAt: now,
        updatedAt: now,
      }

      setChats((prev) => [newChat, ...prev])
      setActiveChatState(newChat)
      return newChatId
    } catch (error) {
      console.error("Erro ao criar chat:", error)
      throw error
    }
  }

  const updateChatTitle = async (chatId: string, title: string) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({
          title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", chatId)
        .eq("user_id", user.id)

      if (error) throw error

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === chatId) {
            return { ...chat, title, updatedAt: new Date() }
          }
          return chat
        }),
      )

      if (activeChat?.id === chatId) {
        setActiveChatState((prev) => (prev ? { ...prev, title } : null))
      }
    } catch (error) {
      console.error("Erro ao atualizar título do chat:", error)
      throw error
    }
  }

  const deleteChat = async (chatId: string) => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      // Primeiro excluir todas as mensagens do chat
      const { error: msgError } = await supabase.from("chat_messages").delete().eq("chat_id", chatId)

      if (msgError) throw msgError

      // Depois excluir o chat
      const { error: chatError } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", chatId)
        .eq("user_id", user.id)

      if (chatError) throw chatError

      setChats((prev) => prev.filter((chat) => chat.id !== chatId))

      if (activeChat?.id === chatId) {
        setActiveChatState(null)
      }
    } catch (error) {
      console.error("Erro ao excluir chat:", error)
      throw error
    }
  }

  const setActiveChat = (chatId: string | null) => {
    if (!chatId) {
      setActiveChatState(null)
      return
    }

    const chat = chats.find((c) => c.id === chatId)
    setActiveChatState(chat || null)
  }

  const addMessage = async (chatId: string, message: Omit<Message, "id" | "createdAt">) => {
    if (!user) throw new Error("Usuário não autenticado")

    const messageId = uuidv4()
    const now = new Date()

    try {
      // Adicionar mensagem no Supabase
      const { error: msgError } = await supabase.from("chat_messages").insert([
        {
          id: messageId,
          chat_id: chatId,
          role: message.role,
          content: message.content,
          created_at: now.toISOString(),
        },
      ])

      if (msgError) throw msgError

      // Atualizar timestamp do chat
      const { error: chatError } = await supabase
        .from("chat_conversations")
        .update({ updated_at: now.toISOString() })
        .eq("id", chatId)
        .eq("user_id", user.id)

      if (chatError) throw chatError

      const newMessage: Message = {
        ...message,
        id: messageId,
        createdAt: now,
      }

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === chatId) {
            // Se for a primeira mensagem do usuário, gerar um título
            let title = chat.title
            if (chat.messages.length === 0 && message.role === "user") {
              title = generateTitle(message.content)

              // Atualizar título no Supabase
              supabase
                .from("chat_conversations")
                .update({ title })
                .eq("id", chatId)
                .eq("user_id", user.id)
                .then()
                .catch((err) => console.error("Erro ao atualizar título:", err))
            }

            return {
              ...chat,
              messages: [...chat.messages, newMessage],
              title,
              updatedAt: now,
            }
          }
          return chat
        }),
      )

      // Atualizar o chat ativo se for o mesmo
      if (activeChat?.id === chatId) {
        setActiveChatState((prev) => {
          if (!prev) return null

          // Se for a primeira mensagem do usuário, gerar um título
          let title = prev.title
          if (prev.messages.length === 0 && message.role === "user") {
            title = generateTitle(message.content)
          }

          return {
            ...prev,
            messages: [...prev.messages, newMessage],
            title,
            updatedAt: now,
          }
        })
      }
    } catch (error) {
      console.error("Erro ao adicionar mensagem:", error)
      throw error
    }
  }

  const clearChats = async () => {
    if (!user) throw new Error("Usuário não autenticado")

    try {
      // Primeiro excluir todas as mensagens
      const { error: msgError } = await supabase
        .from("chat_messages")
        .delete()
        .in(
          "chat_id",
          chats.map((c) => c.id),
        )

      if (msgError) throw msgError

      // Depois excluir todos os chats
      const { error: chatError } = await supabase.from("chat_conversations").delete().eq("user_id", user.id)

      if (chatError) throw chatError

      setChats([])
      setActiveChatState(null)
    } catch (error) {
      console.error("Erro ao limpar chats:", error)
      throw error
    }
  }

  // Função para gerar um título baseado na primeira mensagem
  const generateTitle = (message: string) => {
    // Limitar a 30 caracteres e adicionar "..." se for maior
    return message.length > 30 ? `${message.substring(0, 30)}...` : message
  }

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        createChat,
        updateChatTitle,
        deleteChat,
        setActiveChat,
        addMessage,
        clearChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat deve ser usado dentro de um ChatProvider")
  }
  return context
}
