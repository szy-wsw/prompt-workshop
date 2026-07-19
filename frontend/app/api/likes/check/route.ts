import { dbQuery, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const url = new URL(req.url)
  const prompt_id = url.searchParams.get('prompt_id')

  if (!prompt_id) return errorResponse('缺少prompt_id')

  const likes = await dbQuery('likes', { prompt_id, user_id: userId }, { limit: 1 })
  const liked = likes.length > 0

  return successResponse({ liked })
}
