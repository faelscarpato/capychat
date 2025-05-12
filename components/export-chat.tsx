"use client"

import { useState } from "react"
import { useChat } from "@/contexts/chat-context"
import { usePersonality } from "@/contexts/personality-context"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ExportChat() {
  const { activeChat } = useChat()
  const { personalities } = usePersonality()
  const [isExporting, setIsExporting] = useState(false)

  if (!activeChat) return null

  const personality = personalities.find((p) => p.id === activeChat.personalityId)

  const exportAsText = () => {
    setIsExporting(true)
    try {
      const content = activeChat.messages
        .map((msg) => {
          const sender = msg.role === "user" ? "Você" : personality?.name || "IA"
          return `${sender}:\n${msg.content}\n\n`
        })
        .join("")

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${activeChat.title.replace(/[^\w\s]/gi, "")}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar chat:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsMarkdown = () => {
    setIsExporting(true)
    try {
      const content =
        `# ${activeChat.title}\n\n` +
        activeChat.messages
          .map((msg) => {
            const sender = msg.role === "user" ? "Você" : personality?.name || "IA"
            return `## ${sender}\n\n${msg.content}\n\n`
          })
          .join("")

      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${activeChat.title.replace(/[^\w\s]/gi, "")}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar chat:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isExporting || activeChat.messages.length === 0}>
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsText}>Exportar como Texto</DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown}>Exportar como Markdown</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
