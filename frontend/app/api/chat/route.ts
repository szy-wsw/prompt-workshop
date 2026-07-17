import { verifyAuth, errorResponse, handleOptions, SILICONFLOW_API_KEY, SILICONFLOW_BASE_URL, FREE_MODEL_ID } from '@/lib/supabase-server'

export const runtime = 'edge'

const RATE_LIMIT = 8
const RATE_LIMIT_WINDOW = 60
const rateLimitStore = new Map<string, { count: number; start: number }>()

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  // 限流
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
    const body = await req.json()
    const messages = body?.messages ?? []
    const prompt = body?.prompt ?? ''

    if (prompt && messages.length === 0) {
      messages.push({ role: 'user', content: prompt })
    }
    if (messages.length === 0) return errorResponse('请输入内容')

    const sfRes = await fetch(`${SILICONFLOW_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: FREE_MODEL_ID,
        messages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (sfRes.status === 429) return errorResponse('AI访问繁忙，请稍后重试', 429)
    if (!sfRes.ok) return errorResponse(`AI服务异常(${sfRes.status})`, 502)

    const stream = new ReadableStream({
      async start(controller) {
        const reader = sfRes.body!.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const jsonStr = line.slice(6).trim()
              if (jsonStr === '[DONE]') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: '', done: true })}\n\n`))
                continue
              }
              try {
                const parsed = JSON.parse(jsonStr)
                const delta = parsed?.choices?.[0]?.delta
                const content = delta?.content ?? ''
                const finish = parsed?.choices?.[0]?.finish_reason
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: content, done: false })}\n\n`))
                }
                if (finish) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: '', done: true })}\n\n`))
                }
              } catch { /* skip */ }
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`))
        } finally {
          controller.close()
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
