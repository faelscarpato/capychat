"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import { supabase } from "@/lib/supabase"
import { initializeDatabase } from "@/lib/db-init"

type ThemeColor = "blue" | "purple" | "green" | "red" | "amber" | "pink" | "indigo" | "teal" | "orange" | "slate"

interface ThemeContextType {
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => Promise<void>
  getThemeClass: (baseClass: string) => string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const themeClasses: Record<ThemeColor, Record<string, string>> = {
  blue: {
    "bg-primary": "bg-blue-600",
    "text-primary": "text-blue-600",
    "border-primary": "border-blue-600",
    "hover:bg-primary": "hover:bg-blue-700",
    "focus:ring-primary": "focus:ring-blue-500",
  },
  purple: {
    "bg-primary": "bg-purple-600",
    "text-primary": "text-purple-600",
    "border-primary": "border-purple-600",
    "hover:bg-primary": "hover:bg-purple-700",
    "focus:ring-primary": "focus:ring-purple-500",
  },
  green: {
    "bg-primary": "bg-green-600",
    "text-primary": "text-green-600",
    "border-primary": "border-green-600",
    "hover:bg-primary": "hover:bg-green-700",
    "focus:ring-primary": "focus:ring-green-500",
  },
  red: {
    "bg-primary": "bg-red-600",
    "text-primary": "text-red-600",
    "border-primary": "border-red-600",
    "hover:bg-primary": "hover:bg-red-700",
    "focus:ring-primary": "focus:ring-red-500",
  },
  amber: {
    "bg-primary": "bg-amber-600",
    "text-primary": "text-amber-600",
    "border-primary": "border-amber-600",
    "hover:bg-primary": "hover:bg-amber-700",
    "focus:ring-primary": "focus:ring-amber-500",
  },
  pink: {
    "bg-primary": "bg-pink-600",
    "text-primary": "text-pink-600",
    "border-primary": "border-pink-600",
    "hover:bg-primary": "hover:bg-pink-700",
    "focus:ring-primary": "focus:ring-pink-500",
  },
  indigo: {
    "bg-primary": "bg-indigo-600",
    "text-primary": "text-indigo-600",
    "border-primary": "border-indigo-600",
    "hover:bg-primary": "hover:bg-indigo-700",
    "focus:ring-primary": "focus:ring-indigo-500",
  },
  teal: {
    "bg-primary": "bg-teal-600",
    "text-primary": "text-teal-600",
    "border-primary": "border-teal-600",
    "hover:bg-primary": "hover:bg-teal-700",
    "focus:ring-primary": "focus:ring-teal-500",
  },
  orange: {
    "bg-primary": "bg-orange-600",
    "text-primary": "text-orange-600",
    "border-primary": "border-orange-600",
    "hover:bg-primary": "hover:bg-orange-700",
    "focus:ring-primary": "focus:ring-orange-500",
  },
  slate: {
    "bg-primary": "bg-slate-600",
    "text-primary": "text-slate-600",
    "border-primary": "border-slate-600",
    "hover:bg-primary": "hover:bg-slate-700",
    "focus:ring-primary": "focus:ring-slate-500",
  },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [themeColor, setThemeColorState] = useState<ThemeColor>("blue")
  const [dbInitialized, setDbInitialized] = useState(false)

  // Initialize database tables if needed
  useEffect(() => {
    const init = async () => {
      if (user && !dbInitialized) {
        const initialized = await initializeDatabase()
        setDbInitialized(initialized)
      }
    }

    init()
  }, [user, dbInitialized])

  // Load theme from Supabase or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      if (!user) return

      try {
        // Try to load from Supabase first
        try {
          const { data, error } = await supabase
            .from("user_preferences")
            .select("theme_color")
            .eq("user_id", user.id)
            .single()

          if (error) {
            // If it's not the "relation does not exist" error, log it
            if (!error.message.includes("relation") || !error.message.includes("does not exist")) {
              console.error("Error loading theme:", error)
            }

            // Fall back to localStorage
            const storedTheme = localStorage.getItem(`theme_color_${user.id}`)
            if (storedTheme && Object.keys(themeClasses).includes(storedTheme)) {
              setThemeColorState(storedTheme as ThemeColor)
            }
          } else if (data && data.theme_color) {
            setThemeColorState(data.theme_color as ThemeColor)
          }
        } catch (error) {
          console.error("Error loading theme from database:", error)

          // Fall back to localStorage
          const storedTheme = localStorage.getItem(`theme_color_${user.id}`)
          if (storedTheme && Object.keys(themeClasses).includes(storedTheme)) {
            setThemeColorState(storedTheme as ThemeColor)
          }
        }
      } catch (error) {
        console.error("Error loading theme:", error)
      }
    }

    if (user) {
      loadTheme()
    }
  }, [user, dbInitialized])

  const setThemeColor = async (color: ThemeColor) => {
    if (!user) return

    setThemeColorState(color)

    // Save to localStorage as backup
    localStorage.setItem(`theme_color_${user.id}`, color)

    try {
      // Ensure database is initialized
      if (!dbInitialized) {
        await initializeDatabase()
        setDbInitialized(true)
      }

      // Try to save to Supabase
      try {
        // Check if user preference exists
        const { data, error } = await supabase.from("user_preferences").select("id").eq("user_id", user.id).single()

        if (error) {
          // If it's not the "relation does not exist" error, log it
          if (!error.message.includes("relation") || !error.message.includes("does not exist")) {
            console.error("Error checking user preferences:", error)
          }

          // Try to create new preference
          const { error: insertError } = await supabase
            .from("user_preferences")
            .insert([{ user_id: user.id, theme_color: color }])

          if (
            insertError &&
            (!insertError.message.includes("relation") || !insertError.message.includes("does not exist"))
          ) {
            console.error("Error creating user preference:", insertError)
          }
        } else if (data) {
          // Update existing preference
          const { error: updateError } = await supabase
            .from("user_preferences")
            .update({ theme_color: color })
            .eq("user_id", user.id)

          if (
            updateError &&
            (!updateError.message.includes("relation") || !updateError.message.includes("does not exist"))
          ) {
            console.error("Error updating user preference:", updateError)
          }
        } else {
          // Create new preference
          const { error: insertError } = await supabase
            .from("user_preferences")
            .insert([{ user_id: user.id, theme_color: color }])

          if (
            insertError &&
            (!insertError.message.includes("relation") || !insertError.message.includes("does not exist"))
          ) {
            console.error("Error creating user preference:", insertError)
          }
        }
      } catch (error) {
        console.error("Error saving theme to database:", error)
      }
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  const getThemeClass = (baseClass: string) => {
    return themeClasses[themeColor][baseClass] || baseClass
  }

  return <ThemeContext.Provider value={{ themeColor, setThemeColor, getThemeClass }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
