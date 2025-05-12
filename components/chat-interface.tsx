"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@/contexts/chat-context"
import { usePersonality } from "@/contexts/personality-context"
import { useTheme } from "@/contexts/theme-context"
import ChatInput from "./chat-input"
import ChatMessage from "./chat-message"
import { ExportChat } from "./export-chat"
import { Loader2, Home } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ChatInterface() {
  const { activeChat, addMessage, setActiveChat, loading: chatLoading } = useChat()
  const { personalities, currentPersonality, loading: personalityLoading } = usePersonality()
  const { getThemeClass } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState("")
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const personality = activeChat
    ? personalities.find((p) => p.id === activeChat.personalityId) || personalities[0]
    : currentPersonality

  const handleSendMessage = async (content: string) => {
    if (!activeChat || !content.trim() || isLoading) return

    // Adicionar mensagem do usuário
    await addMessage(activeChat.id, {
      role: "user",
      content,
    })

    setIsLoading(true)
    setInput("")

    try {
      // Criar ID para a mensagem de streaming
      const tempMessageId = uuidv4()
      setStreamingMessageId(tempMessageId)
      setStreamingContent("")

      // Adicionar mensagem vazia da IA que será preenchida com streaming
      await addMessage(activeChat.id, {
        id: tempMessageId,
        role: "assistant",
        content: "",
      })

      // Iniciar streaming
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...activeChat.messages, { role: "user", content }],
          systemPrompt: personality?.systemPrompt,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao obter resposta")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Não foi possível obter o reader do response body")
      }

      const decoder = new TextDecoder()
      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decodificar o chunk
        const chunk = decoder.decode(value, { stream: true })

        // Processar cada linha do chunk
        const lines = chunk.split("\n").filter((line) => line.trim() !== "")

        for (const line of lines) {
          try {
            const data = JSON.parse(line)

            if (data.type === "chunk") {
              accumulatedContent += data.text
              setStreamingContent(accumulatedContent)

              // Atualizar a mensagem no contexto
              await addMessage(activeChat.id, {
                id: tempMessageId,
                role: "assistant",
                content: accumulatedContent,
              })
            } else if (data.type === "error") {
              throw new Error(data.error)
            }
          } catch (e) {
            console.error("Erro ao processar chunk:", e)
          }
        }
      }

      // Finalizar streaming
      setStreamingMessageId(null)
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)

      // Adicionar mensagem de erro se não houver mensagem de streaming
      if (!streamingMessageId) {
        await addMessage(activeChat.id, {
          role: "assistant",
          content: "Desculpe, encontrei um erro. Por favor, tente novamente.",
        })
      }
    } finally {
      setIsLoading(false)
      setStreamingMessageId(null)
    }
  }

  const handleGoHome = () => {
    setActiveChat(null)
    router.push("/")
  }

  // Auto-scroll para o final quando as mensagens mudarem ou durante streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeChat?.messages, streamingContent])

  if (chatLoading || personalityLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!activeChat || !personality) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Selecione ou inicie uma conversa</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoHome}
            className="md:hidden"
            title="Voltar para página inicial"
          >
            <Home size={20} />
          </Button>
          <div className={`flex items-center justify-center h-8 w-8 rounded-full ${personality.color} text-white`}>
            {personality.avatar}
          </div>
          <div>
            <h2 className="font-medium">{personality.name}</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">{personality.description}</p>
          </div>
        </div>
        <ExportChat />
      </header>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
        {activeChat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <div className="text-4xl mb-4">{personality.avatar}</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Olá! Sou {personality.name}</h2>
            <p className="max-w-md text-sm sm:text-base">{personality.description}</p>
            <p className="mt-4 text-sm sm:text-base">Como posso ajudar você hoje?</p>
          </div>
        ) : (
          activeChat.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              personality={message.role === "assistant" ? personality : undefined}
              isStreaming={message.id === streamingMessageId}
            />
          ))
        )}

        {isLoading && !streamingMessageId && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>{personality.name} está digitando...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 sm:p-4 border-t">
        <ChatInput
          input={input}
          setInput={setInput}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          personality={personality}
        />
      </div>
    </div>
  )
}
