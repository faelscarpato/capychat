import { NextResponse } from "next/server"

export const maxDuration = 30 // Permitir streaming por até 30 segundos

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

export async function POST(request: Request) {
  try {
    const { messages, systemPrompt } = await request.json()

    // Formatar mensagens para o formato que o Gemini espera
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }))

    // Adicionar o prompt do sistema como uma mensagem do modelo no início
    if (systemPrompt) {
      formattedMessages.unshift({
        role: "model",
        parts: [{ text: systemPrompt }],
      })
    }

    // Criar um novo ReadableStream para streaming da resposta
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder()

          // Configurar a requisição para a API do Gemini
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: formattedMessages,
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 2048,
                },
                safetySettings: [
                  {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                  },
                  {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                  },
                  {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                  },
                  {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                  },
                ],
              }),
            },
          )

          if (!response.ok) {
            const errorData = await response.json()
            console.error("Erro na API do Gemini:", errorData)
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  error: `Erro na API do Gemini: ${response.status}`,
                }),
              ),
            )
            controller.close()
            return
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error("Não foi possível obter o reader do response body")
          }

          const decoder = new TextDecoder()
          let buffer = ""
          let completeText = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Decodificar o chunk e adicionar ao buffer
            buffer += decoder.decode(value, { stream: true })

            // Processar linhas completas no buffer
            let lineEnd
            while ((lineEnd = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, lineEnd)
              buffer = buffer.slice(lineEnd + 1)

              if (line.startsWith("data: ")) {
                const jsonData = line.slice(6)
                if (jsonData === "[DONE]") continue

                try {
                  const data = JSON.parse(jsonData)
                  const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

                  if (textChunk) {
                    completeText += textChunk
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: "chunk",
                          text: textChunk,
                        }),
                      ),
                    )
                  }
                } catch (e) {
                  console.error("Erro ao processar chunk:", e)
                }
              }
            }
          }

          // Enviar mensagem de conclusão
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "done",
                text: completeText,
              }),
            ),
          )
          controller.close()
        } catch (error) {
          console.error("Erro no streaming:", error)
          const encoder = new TextEncoder()
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: "Falha ao processar sua solicitação",
              }),
            ),
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Erro no processamento:", error)
    return NextResponse.json({ error: "Falha ao processar sua solicitação" }, { status: 500 })
  }
}
