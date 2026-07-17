import { getSupabaseServer, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const supabase = getSupabaseServer()
  const { data, error: qError } = await supabase
    .from('collections')
    .select('prompt_id, prompts(*, profiles:author_id(nickname, avatar_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (qError) return errorResponse(qError.message, 400)

  const prompts = data?.map((item: any) => item.prompts).filter(Boolean) || []
  return successResponse({ data: prompts, total: prompts.length })
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const supabase = getSupabaseServer()
  const { error: insError } = await supabase.from('collections').insert({ prompt_id, user_id: userId })

  if (insError) {
    if (insError.code === '23505') return errorResponse('您已经收藏过啦')
    return errorResponse(insError.message, 400)
  }

  return successResponse(null, '收藏成功')
}

export async function DELETE(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { prompt_id } = await req.json()
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const supabase = getSupabaseServer()
  const { error: delError } = await supabase.from('collections').delete().eq('prompt_id', prompt_id).eq('user_id', userId)

  if (delError) return errorResponse(delError.message, 400)
  return successResponse(null, '取消收藏成功')
}
