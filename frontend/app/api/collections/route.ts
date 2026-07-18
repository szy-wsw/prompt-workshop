import { tcbDbQuery, tcbDbAdd, tcbDbDelete, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const collections = await tcbDbQuery('collections', { user_id: userId }, {
    orderBy: 'created_at',
    orderDirection: 'desc',
  })

  const promptIds = collections.map((c: any) => c.prompt_id)
  const prompts = promptIds.length > 0
    ? await tcbDbQuery('prompts', {}, {})
    : []

  const result = collections.map((col: any) => {
    const prompt = prompts.find((p: any) => String(p._id) === String(col.prompt_id))
    if (prompt) {
      const promptAny = prompt as any
      return {
        ...col,
        prompts: {
          ...promptAny,
          id: promptAny._id || promptAny.id,
        },
      }
    }
    return null
  }).filter(Boolean)

  return successResponse({ data: result, total: result.length })
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const existing = await tcbDbQuery('collections', { prompt_id, user_id: userId }, { limit: 1 })
  if (existing.length > 0) {
    return errorResponse('您已经收藏过啦')
  }

  await tcbDbAdd('collections', { prompt_id, user_id: userId })

  return successResponse(null, '收藏成功')
}

export async function DELETE(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  await tcbDbDelete('collections', { prompt_id, user_id: userId })

  return successResponse(null, '取消收藏成功')
}
