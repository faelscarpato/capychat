"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./auth-context"

export interface Personality {
  id: string
  name: string
  description: string
  systemPrompt: string
  avatar: string
  color: string
  isCustom?: boolean
}

export const defaultPersonalities: Personality[] = [
  {
    id: "assistente",
    name: "Assistente Prestativo",
    description: "Um assistente de IA amigável e prestativo",
    systemPrompt:
      "Você é um assistente de IA prestativo. Forneça respostas precisas, úteis e concisas. Formate suas respostas usando Markdown quando apropriado.",
    avatar: "🧠",
    color: "bg-blue-600",
  },
  {
    id: "criativo",
    name: "Escritor Criativo",
    description: "Um contador de histórias imaginativo e criativo",
    systemPrompt:
      "Você é um escritor criativo com imaginação vívida. Crie respostas envolventes, descritivas e imaginativas. Use linguagem rica e técnicas de narrativa. Formate suas respostas usando Markdown quando apropriado.",
    avatar: "✍️",
    color: "bg-purple-600",
  },
  {
    id: "programador",
    name: "Especialista em Código",
    description: "Um expert em programação e tecnologia",
    systemPrompt:
      "Você é um especialista em programação. Forneça explicações técnicas detalhadas e exemplos de código. Sempre use formatação de código adequada com destaque de sintaxe. Priorize boas práticas, eficiência e legibilidade em seus exemplos. Formate suas respostas usando Markdown com blocos de código.",
    avatar: "👨‍💻",
    color: "bg-green-600",
  },
  {
    id: "filosofo",
    name: "Filósofo",
    description: "Um pensador profundo que explora ideias sobre existência e conhecimento",
    systemPrompt:
      "Você é um filósofo que explora questões profundas sobre existência, conhecimento, valores, razão, mente e linguagem. Forneça perspectivas reflexivas e nuançadas que estimulem a reflexão. Considere múltiplos pontos de vista e a complexidade das questões. Formate suas respostas usando Markdown quando apropriado.",
    avatar: "🧐",
    color: "bg-amber-600",
  },
  {
    id: "professor",
    name: "Educador",
    description: "Um professor paciente que explica conceitos de forma clara",
    systemPrompt:
      "Você é um educador que se destaca em explicar conceitos complexos em termos simples. Divida a informação em partes digeríveis, use analogias quando úteis e estruture as explicações de forma lógica. Seu objetivo é ajudar o usuário a compreender verdadeiramente o assunto. Formate suas respostas usando Markdown quando apropriado.",
    avatar: "👩‍🏫",
    color: "bg-red-600",
  },
  {
    id: "marketing",
    name: "Especialista em Marketing Digital",
    description: "Mestre em atrair e converter público online",
    systemPrompt:
      "Você é um especialista em marketing digital. Analise campanhas, sugira estratégias de SEO, Google Ads e redes sociais, monte funis de vendas e crie calendários editoriais. Forneça métricas-chave (CTR, CAC, ROI) e exemplos práticos adaptados ao mercado brasileiro. Ofereça dicas de execução rápidas e orientações para otimização contínua.",
    avatar: "📈",
    color: "bg-pink-600",
  },
  {
    id: "coach",
    name: "Coach de Carreira",
    description: "Focado em potencializar trajetórias profissionais",
    systemPrompt:
      "Você é um coach de carreira. Aplique exercícios de autoconhecimento (análise SWOT pessoal), ajude a definir objetivos de curto e longo prazo, e prepare o usuário para entrevistas e networking. Seja motivacional, ofereça feedback direto e planos de ação semanais para o desenvolvimento de habilidades.",
    avatar: "🚀",
    color: "bg-yellow-600",
  },
  {
    id: "mentor",
    name: "Mentor de Startups",
    description: "Histórico de lançamentos de negócios bem-sucedidos",
    systemPrompt:
      "Você é um mentor de startups. Oriente sobre validação de ideias, MVP, pitch para investidores e captação de recursos. Estruture roadmaps de produto, defina métricas de sucesso (OKRs) e sugira metodologias Lean e Design Thinking. Use insights reais de casos brasileiros e estrangeiros para embasar suas recomendações.",
    avatar: "🌱",
    color: "bg-green-500",
  },
]

interface PersonalityContextType {
  personalities: Personality[]
  currentPersonality: Personality | null
  setCurrentPersonality: (personalityId: string) => void
  addPersonality: (personality: Omit<Personality, "id">) => Promise<string>
  updatePersonality: (personality: Personality) => Promise<void>
  deletePersonality: (personalityId: string) => Promise<void>
  loading: boolean
}

const PersonalityContext = createContext<PersonalityContextType | undefined>(undefined)

export function PersonalityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [personalities, setPersonalities] = useState<Personality[]>(defaultPersonalities)
  const [currentPersonality, setCurrentPersonalityState] = useState<Personality | null>(null)
  const [loading, setLoading] = useState(true)

  // Load custom personalities from Supabase
  useEffect(() => {
    const loadPersonalities = async () => {
      if (!user) return

      try {
        setLoading(true)
        const { data, error } = await supabase.from("custom_personalities").select("*").eq("user_id", user.id)

        if (error) {
          console.error("Error loading personalities:", error)
          return
        }

        if (data && data.length > 0) {
          const customPersonalities = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            systemPrompt: p.system_prompt,
            avatar: p.avatar,
            color: p.color,
            isCustom: true,
          }))

          setPersonalities([...defaultPersonalities, ...customPersonalities])
        }
      } catch (error) {
        console.error("Error loading personalities:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadPersonalities()
    }
  }, [user])

  const setCurrentPersonality = (personalityId: string) => {
    const personality = personalities.find((p) => p.id === personalityId) || null
    setCurrentPersonalityState(personality)

    // Save to localStorage as backup
    if (personality && user) {
      localStorage.setItem(`currentPersonality_${user.id}`, personalityId)
    }
  }

  const addPersonality = async (personality: Omit<Personality, "id">) => {
    if (!user) throw new Error("User not authenticated")

    const newPersonalityId = uuidv4()

    try {
      const { error } = await supabase.from("custom_personalities").insert([
        {
          id: newPersonalityId,
          name: personality.name,
          description: personality.description,
          system_prompt: personality.systemPrompt,
          avatar: personality.avatar,
          color: personality.color,
          user_id: user.id,
        },
      ])

      if (error) throw error

      const newPersonality = {
        ...personality,
        id: newPersonalityId,
        isCustom: true,
      }

      setPersonalities((prev) => [...prev, newPersonality])
      return newPersonalityId
    } catch (error) {
      console.error("Error adding personality:", error)
      throw error
    }
  }

  const updatePersonality = async (personality: Personality) => {
    if (!user) throw new Error("User not authenticated")
    if (!personality.isCustom) throw new Error("Cannot edit default personalities")

    try {
      const { error } = await supabase
        .from("custom_personalities")
        .update({
          name: personality.name,
          description: personality.description,
          system_prompt: personality.systemPrompt,
          avatar: personality.avatar,
          color: personality.color,
        })
        .eq("id", personality.id)
        .eq("user_id", user.id)

      if (error) throw error

      setPersonalities((prev) => prev.map((p) => (p.id === personality.id ? personality : p)))
    } catch (error) {
      console.error("Error updating personality:", error)
      throw error
    }
  }

  const deletePersonality = async (personalityId: string) => {
    if (!user) throw new Error("User not authenticated")

    const personality = personalities.find((p) => p.id === personalityId)
    if (!personality?.isCustom) throw new Error("Cannot delete default personalities")

    try {
      const { error } = await supabase
        .from("custom_personalities")
        .delete()
        .eq("id", personalityId)
        .eq("user_id", user.id)

      if (error) throw error

      setPersonalities((prev) => prev.filter((p) => p.id !== personalityId))

      // If current personality is deleted, reset it
      if (currentPersonality?.id === personalityId) {
        setCurrentPersonalityState(null)
      }
    } catch (error) {
      console.error("Error deleting personality:", error)
      throw error
    }
  }

  return (
    <PersonalityContext.Provider
      value={{
        personalities,
        currentPersonality,
        setCurrentPersonality,
        addPersonality,
        updatePersonality,
        deletePersonality,
        loading,
      }}
    >
      {children}
    </PersonalityContext.Provider>
  )
}

export function usePersonality() {
  const context = useContext(PersonalityContext)
  if (context === undefined) {
    throw new Error("usePersonality must be used within a PersonalityProvider")
  }
  return context
}
