"use client"

import { useEffect, useState } from "react"
import { useChat } from "@/contexts/chat-context"
import ChatInterface from "@/components/chat-interface"
import PersonalityGallery from "@/components/personality-gallery"
import { Sidebar } from "@/components/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ProtectedRoute } from "@/components/protected-route"

export default function Home() {
  const { activeChat } = useChat()
  const [showGallery, setShowGallery] = useState(true)

  useEffect(() => {
    // Se já existe um chat ativo, não mostra a galeria
    if (activeChat) {
      setShowGallery(false)
    }
  }, [activeChat])

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            {showGallery ? <PersonalityGallery onSelect={() => setShowGallery(false)} /> : <ChatInterface />}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
