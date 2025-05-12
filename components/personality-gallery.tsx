"use client"

import { useState } from "react"
import { usePersonality } from "@/contexts/personality-context"
import { useChat } from "@/contexts/chat-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PersonalityCreator } from "./personality-creator"
import { PlusCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

interface PersonalityGalleryProps {
  onSelect: () => void
}

export default function PersonalityGallery({ onSelect }: PersonalityGalleryProps) {
  const { personalities, setCurrentPersonality } = usePersonality()
  const { createChat } = useChat()
  const [searchTerm, setSearchTerm] = useState("")
  const [showPersonalityCreator, setShowPersonalityCreator] = useState(false)

  const handleSelectPersonality = (personalityId: string) => {
    setCurrentPersonality(personalityId)
    createChat(personalityId)
    onSelect()
  }

  const filteredPersonalities = personalities.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Escolha uma Personalidade de IA</h1>
        <p className="text-xl text-muted-foreground mb-8">Selecione uma personalidade para iniciar uma nova conversa</p>

        <div className="flex flex-col sm:flex-row max-w-md mx-auto mb-8 gap-2">
          <Input
            placeholder="Buscar personalidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />

          <Dialog open={showPersonalityCreator} onOpenChange={setShowPersonalityCreator}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Nova
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Personalidade</DialogTitle>
              </DialogHeader>
              <PersonalityCreator onClose={() => setShowPersonalityCreator(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPersonalities.map((personality) => (
          <Card key={personality.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className={`${personality.color} text-white`}>
              <div className="text-4xl mb-2">{personality.avatar}</div>
              <CardTitle>{personality.name}</CardTitle>
              <CardDescription className="text-white/80">{personality.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm line-clamp-3">{personality.systemPrompt}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleSelectPersonality(personality.id)}>
                Conversar
              </Button>
            </CardFooter>
          </Card>
        ))}

        {filteredPersonalities.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Nenhuma personalidade encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
