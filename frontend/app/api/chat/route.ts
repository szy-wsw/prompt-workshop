import { dbAdd, verifyAuth, errorResponse, handleOptions, AI_API_KEY, AI_BASE_URL, FREE_MODEL_ID } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const RATE_LIMIT = 8
const RATE_LIMIT_WINDOW = 60
const rateLimitStore = new Map<string, { count: number; start: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore) {
    if ((now - value.start) / 1000 > RATE_LIMIT_WINDOW * 2) {
      rateLimitStore.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW * 1000)

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const now = Date.now()
  const record = rateLimitStore.get(userId)
  if (!record) {
    rateLimitStore.set(userId, { count: 1, start: now })
  } else {
    const elapsed = (now - record.start) / 1000
    if (elapsed > RATE_LIMIT_WINDOW) {
      rateLimitStore.set(userId, { count: 1, start: now })
    } else {
      record.count++
      if (record.count > RATE_LIMIT) {
        const remaining = Math.ceil(RATE_LIMIT_WINDOW - elapsed)
        return errorResponse(`请求过于频繁，请${remaining}秒后再试`, 429)
      }
    }
  }

  try {
    if (!AI_API_KEY) {
      return errorResponse('AI服务未配置，请联系管理员设置 AI_API_KEY', 503)
    }

    const body = await req.json()
    const messages = body?.messages ?? []
    const prompt = body?.prompt ?? ''
    const model = body?.model ?? FREE_MODEL_ID
    const conversationId = body?.conversation_id || null
    const saveHistory = body?.save_history !== false

    if (prompt && messages.length === 0) {
      messages.push({ role: 'user', content: prompt })
    }
    if (messages.length === 0) return errorResponse('请输入内容')

    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || ''

    const systemPrompt = `You are a stable and reliable AI assistant. You MUST follow these rules strictly:

1. Auto-correction and fault tolerance: The user's input may be short, incomplete, or contain garbled characters. You must automatically filter invalid characters, infer the user's intent, and always provide a complete, coherent response. Never return fragments, single meaningless characters, or half-sentences.

2. Auto-completion: If the user does not specify a product or scenario, default to generating a general daily-use short video sales copy. If the user mentions scattered keywords, automatically match the closest category. Do not ask counter-questions or ask the user for clarification; directly output the final result.

3. Output format standardization: For copywriting requests, output exactly 3 independent paragraphs, clearly separated by "1. / 2. / 3." Each paragraph must be fluent, complete, and at least 30 Chinese characters long. Do not output half-sentences, meaningless phrases, or fragmented text. Use fluent Simplified Chinese throughout. Do not mix English, do not use pinyin, and do not insert random symbols. Do not wrap the copy in quotation marks.

4. Truncation safety: If the response is about to be truncated, prioritize completing the current paragraph gracefully. It is better to be shorter than to output a half-finished sentence.

5. Conversation fallback: When the user's question is vague, respond based on the most common and reasonable scenario. Do not ask the user to clarify.`

    // 只保留最新的用户消息，避免历史乱码污染模型输出
    const latestUserMessage = messages.filter((m: any) => m.role === 'user').pop()
    const cleanMessages = latestUserMessage ? [{ role: 'user', content: String(latestUserMessage.content).trim() }] : []

    const finalMessages = [{ role: 'system', content: systemPrompt }, ...cleanMessages]

    const sfRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.3,
        top_p: 0.9,
      }),
    })

    if (sfRes.status === 429) return errorResponse('AI访问繁忙，请稍后重试', 429)
    if (!sfRes.ok) {
      const errText = await sfRes.text().catch(() => '')
      return errorResponse(`AI服务异常(${sfRes.status}): ${errText.slice(0, 150)}`, 502)
    }

    let fullResponse = ''
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = sfRes.body!.getReader()
        const decoder = new TextDecoder()
        let streamDone = false
        try {
          while (!streamDone) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const jsonStr = line.slice(6).trim()
              if (jsonStr === '[DONE]') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: '', done: true })}\n\n`))
                streamDone = true
                break
              }
              try {
                const parsed = JSON.parse(jsonStr)
                const delta = parsed?.choices?.[0]?.delta
                if (!delta) continue
                // 处理 content，某些模型可能返回 reasoning_content
                let content = delta.content
                if (content === null || content === undefined) {
                  content = delta.reasoning_content
                }
                if (typeof content === 'string' && content.length > 0) {
                  fullResponse += content
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: content, done: false })}

`))
                }
              } catch { /* skip */ }
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`))
        } finally {
          controller.close()
          
          if (saveHistory && fullResponse && userId) {
            try {
              const now = new Date().toISOString()
              await dbAdd('chat_history', {
                user_id: userId,
                conversation_id: conversationId,
                user_message: lastUserMessage,
                ai_response: fullResponse,
                model,
                created_at: now,
              })
            } catch (saveErr) {
              console.error('Save chat history error:', saveErr)
            }
          }
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  } catch (e) {
    return errorResponse(`AI对话失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
