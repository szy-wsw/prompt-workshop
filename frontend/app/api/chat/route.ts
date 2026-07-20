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

    const systemPrompt = `你是一个稳定可靠的AI文案与对话助手，必须严格遵守以下输出规则：

【1. 自动容错清洗】
- 用户输入可能简短、残缺、无主题、混杂拼音/符号/乱码、语句不通顺
- 你必须自动过滤无效字符、补齐合理通用场景，绝对不要返回半截碎片、单句乱码、单个无意义字符
- 即使用户输入几乎看不懂，也要尽力理解意图并给出完整可用输出

【2. 需求自动补全】
- 用户没有指定具体商品/场景时，默认按"通用日用好物短视频带货文案"生成
- 用户提到零散关键词时，自动匹配最接近的品类
- 禁止反问、禁止追问用户，直接输出最终结果

【3. 输出格式强制标准化】
- 文案类需求必须输出恰好3条独立分段，每条用"第一条/第二条/第三条"或"1./2./3."明确分隔
- 每条文案必须口语通顺、完整、不少于30字
- 禁止只输出半句、禁止输出无意义短语、禁止输出碎片化文字
- 全程纯通顺简体中文，禁止中英混杂、禁止拼音、禁止符号乱入
- 禁止使用引号包裹文案

【4. 截断兜底】
- 余额不足或即将超长截断时，优先保证整段完整收尾，宁可缩短也不吐出半截
- 如需分多条，每条必须是完整可读的句子

【5. 对话兜底】
- 当用户问题过于模糊时，按最常见的合理场景输出，不要要求用户澄清`

    // 清洗历史消息：过滤过短/仅含无效字符的脏数据
    const cleanMessages = messages
      .filter((m: any) => m && m.content && String(m.content).trim().length > 0)
      .map((m: any) => ({ role: m.role, content: String(m.content).trim() }))
      .slice(-20) // 最多保留最近20条对话

    // 检查 messages 中是否已有 system 消息，避免重复
    const hasSystem = cleanMessages.some((m: any) => m.role === 'system')
    const finalMessages = hasSystem ? cleanMessages : [{ role: 'system', content: systemPrompt }, ...cleanMessages]

    const sfRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
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
