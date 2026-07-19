import { dbQuery, dbAdd, dbDelete, dbIncrement, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const existing = await dbQuery('likes', { prompt_id, user_id: userId }, { limit: 1 })
  if (existing.length > 0) {
    return errorResponse('您已经点赞过啦')
  }

  await dbAdd('likes', { prompt_id, user_id: userId })
  await dbIncrement('prompts', { id: prompt_id }, 'likes_count', 1)

  return successResponse(null, '点赞成功')
}

export async function DELETE(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const existing = await dbQuery('likes', { prompt_id, user_id: userId }, { limit: 1 })
  if (existing.length === 0) {
    return errorResponse('您还没有点赞过')
  }

  await dbDelete('likes', { prompt_id, user_id: userId })
  await dbIncrement('prompts', { id: prompt_id }, 'likes_count', -1)

  return successResponse(null, '取消点赞成功')
}
