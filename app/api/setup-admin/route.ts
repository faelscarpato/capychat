import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (email !== "faelscarpato@gmail.com") {
      return NextResponse.json({ error: "Email não autorizado" }, { status: 403 })
    }

    // Verificar se o usuário já existe
    const { data: existingUser, error: searchError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .single()

    let userId

    if (!existingUser) {
      // Criar usuário no Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      userId = data.user.id

      // Inserir na tabela app_users
      const { error: userError } = await supabase.from("app_users").insert([
        {
          id: userId,
          email,
          name: "Administrador",
        },
      ])

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    } else {
      userId = existingUser.id
    }

    // Verificar se já é admin
    const { data: existingAdmin } = await supabase.from("admin_users").select("id").eq("id", userId).single()

    if (!existingAdmin) {
      // Adicionar à tabela admin_users
      const { error: adminError } = await supabase.from("admin_users").insert([
        {
          id: userId,
          email,
          role: "admin",
        },
      ])

      if (adminError) {
        return NextResponse.json({ error: adminError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Administrador configurado com sucesso" })
  } catch (error: any) {
    console.error("Erro ao configurar admin:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
