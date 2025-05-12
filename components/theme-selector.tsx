"use client"

import { useState } from "react"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { Palette } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const themeOptions = [
  { name: "Azul", value: "blue" },
  { name: "Roxo", value: "purple" },
  { name: "Verde", value: "green" },
  { name: "Vermelho", value: "red" },
  { name: "Âmbar", value: "amber" },
  { name: "Rosa", value: "pink" },
  { name: "Índigo", value: "indigo" },
  { name: "Teal", value: "teal" },
  { name: "Laranja", value: "orange" },
  { name: "Cinza", value: "slate" },
]

export function ThemeSelector() {
  const { themeColor, setThemeColor } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Personalizar tema">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              setThemeColor(option.value as any)
              setOpen(false)
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className={`h-4 w-4 rounded-full bg-${option.value}-600`} />
            <span>{option.name}</span>
            {themeColor === option.value && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
