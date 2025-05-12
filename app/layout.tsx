import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { PersonalityProvider } from "@/contexts/personality-context"
import { ChatProvider } from "@/contexts/chat-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chatbot IA",
  description: "Um chatbot de IA inspirado no ChatGPT com múltiplas personalidades",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <NextThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <ThemeProvider>
              <PersonalityProvider>
                <ChatProvider>{children}</ChatProvider>
              </PersonalityProvider>
            </ThemeProvider>
          </AuthProvider>
        </NextThemeProvider>
      </body>
    </html>
  )
}
