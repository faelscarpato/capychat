"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import type { Personality } from "@/contexts/personality-context"

interface ChatInputProps {
  input: string
  setInput: (input: string) => void
  onSendMessage: (message: string) => void
  isLoading: boolean
  personality: Personality
}

export default function ChatInput({ input, setInput, onSendMessage, isLoading, personality }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-redimensionar textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Pergunte algo para ${personality.name}...`}
        className="min-h-[60px] max-h-[200px] resize-none"
        disabled={isLoading}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!input.trim() || isLoading}
        className="h-[60px] w-[60px] rounded-full"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </Button>
    </form>
  )
}
