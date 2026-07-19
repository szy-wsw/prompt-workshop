import { dbQuery, successResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') || '10')

  const users = await dbQuery('users', {}, {
    orderBy: 'created_at',
    orderDirection: 'desc',
    limit: limit * 2,
  })

  const rankings = users.map((user: any) => ({
    id: user.id || user._id,
    nickname: user.nickname,
    email: user.email,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
  })).slice(0, limit)

  return successResponse(rankings)
}