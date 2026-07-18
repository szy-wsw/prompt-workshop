import { tcbDbQuery, tcbDbAdd, tcbDbDelete, tcbDbUpdate, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const existing = await tcbDbQuery('likes', { prompt_id, user_id: userId }, { limit: 1 })
  if (existing.length > 0) {
    return errorResponse('您已经点赞过啦')
  }

  await tcbDbAdd('likes', { prompt_id, user_id: userId })

  const prompts = await tcbDbQuery('prompts', { _id: prompt_id }, { limit: 1 })
  if (prompts.length > 0) {
    const prompt = prompts[0] as any
    await tcbDbUpdate('prompts', { _id: prompt_id }, {
      likes_count: (prompt.likes_count || 0) + 1,
    })
  }

  return successResponse(null, '点赞成功')
}

export async function DELETE(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  await tcbDbDelete('likes', { prompt_id, user_id: userId })

  const prompts = await tcbDbQuery('prompts', { _id: prompt_id }, { limit: 1 })
  if (prompts.length > 0) {
    const prompt = prompts[0] as any
    if (prompt.likes_count && prompt.likes_count > 0) {
      await tcbDbUpdate('prompts', { _id: prompt_id }, {
        likes_count: prompt.likes_count - 1,
      })
    }
  }

  return successResponse(null, '取消点赞成功')
}
