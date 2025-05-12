"use client"

import { useEffect, useState } from "react"
import type { Message } from "@/contexts/chat-context"
import type { Personality } from "@/contexts/personality-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface ChatMessageProps {
  message: Message
  personality?: Personality
  isStreaming?: boolean
}

export default function ChatMessage({ message, personality, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [cursorVisible, setCursorVisible] = useState(true)

  // Efeito de cursor piscando durante streaming
  useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [isStreaming])

  return (
    <div className={cn("flex items-start gap-3 max-w-full", isUser && "flex-row-reverse")}>
      <Avatar className={cn("h-8 w-8", isUser ? "bg-primary" : personality?.color || "bg-green-600")}>
        <AvatarFallback>{isUser ? "U" : personality?.avatar || "IA"}</AvatarFallback>
      </Avatar>

      <div
        className={cn("rounded-lg px-4 py-2 max-w-[80%]", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}
      >
        <ReactMarkdown className="prose dark:prose-invert prose-sm max-w-none break-words">
          {message.content}
          {isStreaming && cursorVisible && <span className="animate-pulse">▌</span>}
        </ReactMarkdown>
      </div>
    </div>
  )
}
