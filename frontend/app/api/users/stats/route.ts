import { getSupabaseServer, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const url = new URL(req.url)
  const targetUserId = url.searchParams.get('user_id') || userId

  const supabase = getSupabaseServer()

  const [{ count: total_prompts }, { count: public_prompts }, { count: total_collections }] = await Promise.all([
    supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('author_id', targetUserId),
    supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('author_id', targetUserId).eq('visibility', 'public'),
    supabase.from('collections').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId),
  ])

  return successResponse({
    total_prompts: total_prompts || 0,
    public_prompts: public_prompts || 0,
    total_collections: total_collections || 0
  })
}
