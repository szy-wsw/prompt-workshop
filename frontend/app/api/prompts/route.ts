import { getSupabaseServer, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const supabase = getSupabaseServer()
  const url = new URL(req.url)
  const user_id = url.searchParams.get('user_id')
  const visibility = url.searchParams.get('visibility')
  const search = url.searchParams.get('search')
  const tag = url.searchParams.get('tag')
  const prompt_id = url.searchParams.get('prompt_id')
  const page = parseInt(url.searchParams.get('page') || '1')
  const per_page = parseInt(url.searchParams.get('per_page') || '50')

  let query = supabase.from('prompts').select('*, profiles:author_id(nickname, avatar_url)', { count: 'exact' })

  if (prompt_id) {
    query = query.eq('id', prompt_id)
  } else if (user_id && visibility) {
    query = query.eq('author_id', user_id).eq('visibility', visibility)
  } else if (user_id) {
    query = query.eq('author_id', user_id)
  } else if (visibility) {
    query = query.eq('visibility', visibility)
  } else {
    query = query.eq('visibility', 'public')
  }

  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  if (tag) query = query.contains('tags', [tag])

  query = query.order('created_at', { ascending: false }).range((page - 1) * per_page, page * per_page - 1)

  const { data, error: qError, count } = await query
  if (qError) return errorResponse(qError.message, 400)

  return successResponse({ data, total: count })
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  try {
    const body = await req.json()
    const supabase = getSupabaseServer()

    const { data, error: insError } = await supabase.from('prompts').insert({
      title: body.title,
      content: body.content,
      tags: body.tags || [],
      visibility: body.visibility || 'private',
      author_id: userId,
      likes_count: 0,
    }).select().single()

    if (insError) return errorResponse(insError.message, 400)

    await supabase.from('prompt_history').insert({
      prompt_id: data.id,
      title: body.title,
      content: body.content,
      tags: body.tags || [],
      visibility: body.visibility || 'private',
      edited_by: userId,
    })

    return successResponse(data, '创建成功')
  } catch (e) {
    return errorResponse(`创建失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
