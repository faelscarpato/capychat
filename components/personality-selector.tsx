"use client"

import { useState } from "react"
import { personalities } from "@/lib/personalities"
import { usePersonality } from "@/contexts/personality-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export default function PersonalitySelector() {
  const { currentPersonality, setPersonality } = usePersonality()
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span className="text-lg">{currentPersonality.avatar}</span>
          <span>{currentPersonality.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {personalities.map((personality) => (
          <DropdownMenuItem
            key={personality.id}
            onClick={() => {
              setPersonality(personality.id)
              setOpen(false)
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-lg">{personality.avatar}</span>
            <div className="flex flex-col">
              <span className="font-medium">{personality.name}</span>
              <span className="text-xs text-muted-foreground">{personality.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
