"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AdminUserForm } from "@/components/admin-user-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AdminPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("users")

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.isAdmin) return

      try {
        setLoading(true)
        const { data, error } = await supabase.from("users").select("*")

        if (error) throw error

        setUsers(data || [])
      } catch (error) {
        console.error("Erro ao buscar usuários:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.isAdmin) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [user])

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/login")}>Ir para Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Apenas administradores podem acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/")}>Voltar para o Início</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Painel de Administração</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="create">Criar Usuário</TabsTrigger>
          <TabsTrigger value="setup">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>Lista de todos os usuários cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-2">{user.name || "N/A"}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2 text-xs text-muted-foreground">{user.id}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground">
                            Nenhum usuário encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <AdminUserForm />
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Sistema</CardTitle>
              <CardDescription>Instruções para configurar o sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Configuração do Banco de Dados</h3>
                <p>Execute os scripts SQL fornecidos no Supabase para criar as tabelas necessárias.</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Configuração de Administrador</h3>
                <p>Para configurar um usuário como administrador, adicione-o à tabela admin_users:</p>
                <pre className="bg-muted p-4 rounded-md text-sm mt-2 overflow-x-auto">
                  {`INSERT INTO admin_users (id, email, role) 
VALUES ('ID_DO_USUARIO', 'EMAIL_DO_USUARIO', 'admin');`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
