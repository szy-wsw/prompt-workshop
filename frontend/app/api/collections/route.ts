import { dbQuery, dbAdd, dbDelete, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const collections = await dbQuery('collections', { user_id: userId }, {
    orderBy: 'created_at',
    orderDirection: 'desc',
  })

  const promptIds = collections.map((c: any) => c.prompt_id)
  const prompts = promptIds.length > 0
    ? await dbQuery('prompts', { visibility: 'public' }, {})
    : []

  const result = collections.map((col: any) => {
    const prompt = prompts.find((p: any) => String(p.id) === String(col.prompt_id))
    if (prompt) {
      const promptAny = prompt as any
      return {
        ...col,
        prompts: {
          ...promptAny,
          id: promptAny.id || promptAny._id,
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

  const existing = await dbQuery('collections', { prompt_id, user_id: userId }, { limit: 1 })
  if (existing.length > 0) {
    return errorResponse('您已经收藏过啦')
  }

  await dbAdd('collections', { prompt_id, user_id: userId })

  return successResponse(null, '收藏成功')
}

export async function DELETE(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  await dbDelete('collections', { prompt_id, user_id: userId })

  return successResponse(null, '取消收藏成功')
}
