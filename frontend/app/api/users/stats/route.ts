import { tcbDbCount, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const url = new URL(req.url)
  const targetUserId = url.searchParams.get('user_id') || userId

  const [total_prompts, public_prompts, total_collections] = await Promise.all([
    tcbDbCount('prompts', { author_id: targetUserId }),
    tcbDbCount('prompts', { author_id: targetUserId, visibility: 'public' }),
    tcbDbCount('collections', { user_id: targetUserId }),
  ])

  return successResponse({
    total_prompts,
    public_prompts,
    total_collections,
  })
}
