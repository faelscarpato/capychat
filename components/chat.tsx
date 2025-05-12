"use client"

import { useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import type { Message } from "@/types/chat"
import ChatInput from "./chat-input"
import ChatMessageComponent from "./chat-message"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePersonality } from "@/contexts/personality-context"
import PersonalitySelector from "./personality-selector"

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentPersonality } = usePersonality()

  // Use the AI SDK's useChat hook for streaming
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages } = useChat({
    api: "/api/chat",
    // Pass the current personality's system prompt
    body: {
      personalityId: currentPersonality.id,
    },
    // Reset chat when personality changes
    id: `chat-${currentPersonality.id}`,
  })

  // Convert AI SDK messages to our app's message format
  const formattedMessages: Message[] = messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: new Date(),
    personalityId: currentPersonality.id,
  }))

  const clearChat = () => {
    setMessages([])
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto h-screen">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">AI Chat</h1>
        <div className="flex items-center gap-2">
          <PersonalitySelector />
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            disabled={messages.length === 0}
            aria-label="Clear chat"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="text-4xl mb-4">{currentPersonality.avatar}</div>
            <h2 className="text-2xl font-bold mb-2">I'm {currentPersonality.name}</h2>
            <p>{currentPersonality.description}</p>
            <p className="mt-4">How can I help you today?</p>
          </div>
        ) : (
          formattedMessages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              personality={message.role === "assistant" ? currentPersonality : undefined}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={cn("p-4 border-t", isLoading && "opacity-80")}>
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          personality={currentPersonality}
        />
      </div>
    </div>
  )
}
