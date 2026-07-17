import { getSupabaseServer, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const supabase = getSupabaseServer()
  const { error: insError } = await supabase.from('likes').insert({ prompt_id, user_id: userId })

  if (insError) {
    if (insError.code === '23505') return errorResponse('您已经点赞过啦')
    return errorResponse(insError.message, 400)
  }

  const { data } = await supabase.from('prompts').select('likes_count').eq('id', prompt_id).single()
  if (data) {
    await supabase.from('prompts').update({ likes_count: (data.likes_count || 0) + 1 }).eq('id', prompt_id)
  }

  return successResponse(null, '点赞成功')
}

export async function DELETE(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const supabase = getSupabaseServer()
  const { error: delError } = await supabase.from('likes').delete().eq('prompt_id', prompt_id).eq('user_id', userId)

  if (delError) return errorResponse(delError.message, 400)

  const { data } = await supabase.from('prompts').select('likes_count').eq('id', prompt_id).single()
  if (data && data.likes_count > 0) {
    await supabase.from('prompts').update({ likes_count: data.likes_count - 1 }).eq('id', prompt_id)
  }

  return successResponse(null, '取消点赞成功')
}
