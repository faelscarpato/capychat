"use client"

import type React from "react"

import { useState } from "react"
import { usePersonality, type Personality } from "@/contexts/personality-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const AVATAR_OPTIONS = [
  "🤖",
  "🧠",
  "👨‍💻",
  "👩‍🏫",
  "🧐",
  "✍️",
  "📚",
  "🔍",
  "🌟",
  "🚀",
  "💡",
  "🎯",
  "🎨",
  "🔬",
  "💻",
  "📊",
  "🌍",
  "🧩",
  "🎭",
  "🎓",
]
const COLOR_OPTIONS = [
  { name: "Azul", value: "bg-blue-600" },
  { name: "Verde", value: "bg-green-600" },
  { name: "Vermelho", value: "bg-red-600" },
  { name: "Roxo", value: "bg-purple-600" },
  { name: "Amarelo", value: "bg-yellow-600" },
  { name: "Rosa", value: "bg-pink-600" },
  { name: "Laranja", value: "bg-orange-600" },
  { name: "Ciano", value: "bg-cyan-600" },
  { name: "Âmbar", value: "bg-amber-600" },
  { name: "Esmeralda", value: "bg-emerald-600" },
  { name: "Índigo", value: "bg-indigo-600" },
  { name: "Violeta", value: "bg-violet-600" },
]

interface PersonalityCreatorProps {
  onClose: () => void
  editPersonality?: Personality
}

export function PersonalityCreator({ onClose, editPersonality }: PersonalityCreatorProps) {
  const { addPersonality, updatePersonality, deletePersonality, personalities } = usePersonality()

  const [formData, setFormData] = useState<Omit<Personality, "id">>({
    name: editPersonality?.name || "",
    description: editPersonality?.description || "",
    systemPrompt: editPersonality?.systemPrompt || "",
    avatar: editPersonality?.avatar || "🤖",
    color: editPersonality?.color || "bg-blue-600",
    isCustom: true,
  })

  const [activeTab, setActiveTab] = useState("criar")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editPersonality) {
      updatePersonality({ ...formData, id: editPersonality.id })
    } else {
      addPersonality(formData)
    }

    onClose()
  }

  const handleDelete = () => {
    if (editPersonality) {
      deletePersonality(editPersonality.id)
      onClose()
    }
  }

  const handleAvatarSelect = (avatar: string) => {
    setFormData((prev) => ({ ...prev, avatar }))
  }

  const handleColorSelect = (color: string) => {
    setFormData((prev) => ({ ...prev, color }))
  }

  return (
    <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="criar">{editPersonality ? "Editar Personalidade" : "Criar Personalidade"}</TabsTrigger>
        <TabsTrigger value="gerenciar">Gerenciar Existentes</TabsTrigger>
      </TabsList>

      <TabsContent value="criar" className="space-y-4 py-4">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                placeholder="Nome da personalidade"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                placeholder="Breve descrição da personalidade"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
              <Textarea
                id="systemPrompt"
                name="systemPrompt"
                placeholder="Instruções detalhadas para a IA"
                value={formData.systemPrompt}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((avatar) => (
                  <Button
                    key={avatar}
                    type="button"
                    variant={formData.avatar === avatar ? "default" : "outline"}
                    className="h-10 w-10 p-0"
                    onClick={() => handleAvatarSelect(avatar)}
                  >
                    {avatar}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <Button
                    key={color.value}
                    type="button"
                    variant="outline"
                    className={`h-8 w-8 p-0 ${color.value} ${
                      formData.color === color.value ? "ring-2 ring-offset-2 ring-offset-background" : ""
                    }`}
                    onClick={() => handleColorSelect(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-4">
              {editPersonality && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Excluir
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit">{editPersonality ? "Atualizar" : "Criar"}</Button>
              </div>
            </div>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="gerenciar" className="space-y-4 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          {personalities
            .filter((p) => p.isCustom)
            .map((personality) => (
              <Card key={personality.id}>
                <CardHeader className={`${personality.color} text-white`}>
                  <div className="text-2xl">{personality.avatar}</div>
                  <CardTitle>{personality.name}</CardTitle>
                  <CardDescription className="text-white/80">{personality.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm line-clamp-2">{personality.systemPrompt}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => deletePersonality(personality.id)}>
                    Excluir
                  </Button>
                  <Button
                    onClick={() => {
                      setFormData({
                        name: personality.name,
                        description: personality.description,
                        systemPrompt: personality.systemPrompt,
                        avatar: personality.avatar,
                        color: personality.color,
                        isCustom: true,
                      })
                      setActiveTab("criar")
                    }}
                  >
                    Editar
                  </Button>
                </CardFooter>
              </Card>
            ))}

          {personalities.filter((p) => p.isCustom).length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Nenhuma personalidade personalizada criada</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
