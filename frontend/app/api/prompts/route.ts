import { tcbDbQuery, tcbDbAdd, tcbDbCount, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const url = new URL(req.url)
  const user_id = url.searchParams.get('user_id')
  const visibility = url.searchParams.get('visibility')
  const search = url.searchParams.get('search')
  const tag = url.searchParams.get('tag')
  const prompt_id = url.searchParams.get('prompt_id')
  const page = parseInt(url.searchParams.get('page') || '1')
  const per_page = parseInt(url.searchParams.get('per_page') || '50')

  const query: Record<string, unknown> = {}
  const options: Record<string, unknown> = {
    orderBy: 'created_at',
    orderDirection: 'desc',
    limit: per_page,
    offset: (page - 1) * per_page,
  }

  if (prompt_id) {
    query['_id'] = prompt_id
  } else if (user_id && visibility) {
    query['author_id'] = user_id
    query['visibility'] = visibility
  } else if (user_id) {
    query['author_id'] = user_id
  } else if (visibility) {
    query['visibility'] = visibility
  } else {
    query['visibility'] = 'public'
  }

  if (search) {
    options['searchFields'] = ['title', 'content']
    options['searchValue'] = search
  }
  if (tag) {
    options['containsField'] = 'tags'
    options['containsValue'] = tag
  }

  const data = await tcbDbQuery('prompts', query, options as any)
  const countQuery: Record<string, unknown> = {}
  if (prompt_id) {
    countQuery['_id'] = prompt_id
  } else if (user_id && visibility) {
    countQuery['author_id'] = user_id
    countQuery['visibility'] = visibility
  } else if (user_id) {
    countQuery['author_id'] = user_id
  } else if (visibility) {
    countQuery['visibility'] = visibility
  } else {
    countQuery['visibility'] = 'public'
  }

  const total = await tcbDbCount('prompts', countQuery)

  return successResponse({ data, total })
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  try {
    const body = await req.json()
    const now = new Date().toISOString()

    const result = await tcbDbAdd<any>('prompts', {
      title: body.title,
      content: body.content,
      tags: body.tags || [],
      visibility: body.visibility || 'private',
      author_id: userId,
      likes_count: 0,
      created_at: now,
      updated_at: now,
    })

    const promptId = result._id || result.id

    await tcbDbAdd('prompt_history', {
      prompt_id: promptId,
      title: body.title,
      content: body.content,
      tags: body.tags || [],
      visibility: body.visibility || 'private',
      edited_by: userId,
      created_at: now,
    })

    return successResponse({ ...result, id: promptId }, '创建成功')
  } catch (e) {
    return errorResponse(`创建失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
