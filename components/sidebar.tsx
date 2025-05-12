"use client"

import { useState } from "react"
import { useChat } from "@/contexts/chat-context"
import { usePersonality } from "@/contexts/personality-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, Settings, LogOut, Home, User } from "lucide-react"
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PersonalityCreator } from "./personality-creator"
import { ThemeToggle } from "./theme-toggle"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"

export function Sidebar() {
  const { chats, activeChat, setActiveChat, createChat, deleteChat } = useChat()
  const { personalities, currentPersonality, setCurrentPersonality } = usePersonality()
  const { user, signOut } = useAuth()
  const [showPersonalityCreator, setShowPersonalityCreator] = useState(false)
  const router = useRouter()

  const handleNewChat = () => {
    if (currentPersonality) {
      createChat(currentPersonality.id)
    } else {
      // Se não houver personalidade selecionada, mostrar a galeria
      router.push("/")
    }
  }

  const handleGoHome = () => {
    setActiveChat(null)
    router.push("/")
  }

  return (
    <>
      <SidebarComponent>
        <SidebarHeader className="p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Chatbot IA</h1>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <SidebarTrigger />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleGoHome} variant="outline" className="flex-1 gap-2">
              <Home size={16} />
              Início
            </Button>
            <Button onClick={handleNewChat} className="flex-1 gap-2">
              <PlusCircle size={16} />
              Nova Conversa
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {user && (
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User size={14} />
                <span className="truncate">{user.name || user.email}</span>
              </div>
            </div>
          )}

          {chats.length > 0 ? (
            <SidebarMenu>
              {chats.map((chat) => {
                const chatPersonality = personalities.find((p) => p.id === chat.personalityId)
                return (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      isActive={activeChat?.id === chat.id}
                      onClick={() => setActiveChat(chat.id)}
                      className="justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-lg">{chatPersonality?.avatar || "🤖"}</span>
                        <span className="truncate">{chat.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(chat.updatedAt, { locale: ptBR, addSuffix: true })}
                      </span>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChat(chat.id)
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          ) : (
            <div className="p-4 text-center text-muted-foreground">Nenhuma conversa iniciada</div>
          )}
        </SidebarContent>

        <SidebarFooter className="p-3 space-y-2">
          <Dialog open={showPersonalityCreator} onOpenChange={setShowPersonalityCreator}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <Settings size={16} />
                Gerenciar Personalidades
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Personalidade</DialogTitle>
              </DialogHeader>
              <PersonalityCreator onClose={() => setShowPersonalityCreator(false)} />
            </DialogContent>
          </Dialog>

          <Button variant="ghost" className="w-full gap-2" onClick={signOut}>
            <LogOut size={16} />
            Sair
          </Button>
        </SidebarFooter>

        <SidebarRail />
      </SidebarComponent>
    </>
  )
}
