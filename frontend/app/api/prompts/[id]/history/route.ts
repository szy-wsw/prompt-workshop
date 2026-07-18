import { tcbDbQuery, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { id } = await params

  const prompts = await tcbDbQuery('prompts', { id: id }, { limit: 1 })
  const prompt = prompts[0] as any
  if (!prompt) return errorResponse('提示词不存在', 404)
  if (prompt.author_id !== userId) return errorResponse('无权限查看', 403)

  const data = await tcbDbQuery('prompt_history', { prompt_id: id }, {
    orderBy: 'created_at',
    orderDirection: 'desc',
  })

  return successResponse(data)
}
