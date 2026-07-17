import { getSupabaseServer, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const url = new URL(req.url)
  const prompt_id = url.searchParams.get('prompt_id')
  if (!prompt_id) return errorResponse('缺少prompt_id')

  const supabase = getSupabaseServer()
  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('prompt_id', prompt_id)
    .eq('user_id', userId)

  return successResponse({ liked: (count || 0) > 0 })
}
