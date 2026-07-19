import { dbQuery, dbCount, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const per_page = parseInt(url.searchParams.get('per_page') || '20')

  const query = { user_id: userId }
  const options = {
    orderBy: 'created_at',
    orderDirection: 'desc' as const,
    limit: per_page,
    offset: (page - 1) * per_page,
  }

  const data = await dbQuery('chat_history', query, options)
  const total = await dbCount('chat_history', query)

  const dataWithId = data.map((item: any) => ({
    ...item,
    id: item._id || item.id,
  }))

  return successResponse({ data: dataWithId, total })
}
