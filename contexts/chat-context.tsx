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
  loading: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChatState] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)

  // Load chats from Supabase
  useEffect(() => {
    const loadChats = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Get all chats for this user
        const { data: chatsData, error: chatsError } = await supabase
          .from("chat_conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })

        if (chatsError) {
          console.error("Error loading chats:", chatsError)
          return
        }

        if (!chatsData || chatsData.length === 0) {
          setChats([])
          setLoading(false)
          return
        }

        // Get all messages for these chats
        const chatIds = chatsData.map((chat) => chat.id)
        const { data: messagesData, error: messagesError } = await supabase
          .from("chat_messages")
          .select("*")
          .in("chat_id", chatIds)
          .order("created_at", { ascending: true })

        if (messagesError) {
          console.error("Error loading messages:", messagesError)
          return
        }

        // Group messages by chat_id
        const messagesByChatId: Record<string, any[]> = {}
        messagesData?.forEach((message) => {
          if (!messagesByChatId[message.chat_id]) {
            messagesByChatId[message.chat_id] = []
          }
          messagesByChatId[message.chat_id].push(message)
        })

        // Format chats with their messages
        const formattedChats = chatsData.map((chat) => ({
          id: chat.id,
          title: chat.title,
          personalityId: chat.personality_id,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at),
          messages: (messagesByChatId[chat.id] || []).map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: new Date(msg.created_at),
          })),
        }))

        setChats(formattedChats)

        // Restore active chat from localStorage
        const activeId = localStorage.getItem(`activeChat_${user.id}`)
        if (activeId) {
          const active = formattedChats.find((c) => c.id === activeId)
          if (active) {
            setActiveChatState(active)
          }
        }
      } catch (error) {
        console.error("Error loading chats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadChats()
    }
  }, [user])

  // Save active chat to localStorage
  useEffect(() => {
    if (user && activeChat) {
      localStorage.setItem(`activeChat_${user.id}`, activeChat.id)
    } else if (user) {
      localStorage.removeItem(`activeChat_${user.id}`)
    }
  }, [activeChat, user])

  const createChat = async (personalityId: string, firstMessage?: string) => {
    if (!user) throw new Error("User not authenticated")

    const newChatId = uuidv4()
    const now = new Date()

    try {
      // Create chat in Supabase
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

      // Add first message if provided
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
      console.error("Error creating chat:", error)
      throw error
    }
  }

  const updateChatTitle = async (chatId: string, title: string) => {
    if (!user) throw new Error("User not authenticated")

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
      console.error("Error updating chat title:", error)
      throw error
    }
  }

  const deleteChat = async (chatId: string) => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Delete messages first
      const { error: msgError } = await supabase.from("chat_messages").delete().eq("chat_id", chatId)

      if (msgError) throw msgError

      // Then delete the chat
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
      console.error("Error deleting chat:", error)
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
    if (!user) throw new Error("User not authenticated")

    const messageId = uuidv4()
    const now = new Date()

    try {
      // Add message to Supabase
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

      // Update chat timestamp
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
            // Generate title from first user message if needed
            let title = chat.title
            if (chat.messages.length === 0 && message.role === "user") {
              title = generateTitle(message.content)

              // Update title in Supabase
              supabase
                .from("chat_conversations")
                .update({ title })
                .eq("id", chatId)
                .eq("user_id", user.id)
                .then()
                .catch((err) => console.error("Error updating title:", err))
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

      // Update active chat if it's the same
      if (activeChat?.id === chatId) {
        setActiveChatState((prev) => {
          if (!prev) return null

          // Generate title from first user message if needed
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
      console.error("Error adding message:", error)
      throw error
    }
  }

  const clearChats = async () => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Delete all messages for this user's chats
      const chatIds = chats.map((c) => c.id)
      if (chatIds.length > 0) {
        const { error: msgError } = await supabase.from("chat_messages").delete().in("chat_id", chatIds)

        if (msgError) throw msgError
      }

      // Delete all chats
      const { error: chatError } = await supabase.from("chat_conversations").delete().eq("user_id", user.id)

      if (chatError) throw chatError

      setChats([])
      setActiveChatState(null)
    } catch (error) {
      console.error("Error clearing chats:", error)
      throw error
    }
  }

  // Generate title from first message
  const generateTitle = (message: string) => {
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
        loading,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
