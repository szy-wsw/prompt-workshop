import { dbQuery, dbAdd, dbCount, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

async function attachAuthorProfiles(prompts: any[]): Promise<any[]> {
  const authorIds = [...new Set(prompts.map((p: any) => p.author_id).filter(Boolean))]
  if (authorIds.length === 0) return prompts

  const users = await dbQuery('users', { id: authorIds })
  const userMap = new Map(
    (users as any[]).map((u: any) => [
      String(u.id),
      { nickname: u.nickname, avatar_url: u.avatar_url || '', email: u.email }
    ])
  )

  return prompts.map((p: any) => ({
    ...p,
    profiles: userMap.get(String(p.author_id)) || { nickname: '未知用户', avatar_url: '' }
  }))
}

export async function GET(req: Request) {
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
    query['id'] = prompt_id
  } else if (user_id && visibility) {
    query['author_id'] = user_id
    query['visibility'] = visibility
  } else if (user_id) {
    const authResult = await verifyAuth(req)
    if (authResult.error) {
      return errorResponse(authResult.error, 401)
    }
    if (authResult.userId !== user_id) {
      query['author_id'] = user_id
      query['visibility'] = 'public'
    } else {
      query['author_id'] = user_id
    }
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

  const data = await dbQuery('prompts', query, options as any)
  
  const filteredData = data.filter((item: any) => !item.deleted_at)
  
  const countQuery: Record<string, unknown> = { ...query }

  const total = await dbCount('prompts', countQuery)

  const dataWithId = filteredData.map((item: any) => ({
    ...item,
    id: item._id || item.id,
  }))

  const dataWithProfiles = await attachAuthorProfiles(dataWithId)

  return successResponse({ data: dataWithProfiles, total: filteredData.length })
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  try {
    const body = await req.json()
    const now = new Date().toISOString()

    const result = await dbAdd<any>('prompts', {
      title: body.title,
      content: body.content,
      tags: body.tags || [],
      visibility: body.visibility || 'private',
      author_id: userId,
      likes_count: 0,
      created_at: now,
      updated_at: now,
    })

    const promptId = result.id || result._id

    await dbAdd('prompt_history', {
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
