import { getSupabaseServer, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { id } = await params
  const supabase = getSupabaseServer()

  const { data: prompt } = await supabase.from('prompts').select('author_id').eq('id', id).single()
  if (!prompt) return errorResponse('提示词不存在', 404)
  if (prompt.author_id !== userId) return errorResponse('无权限查看', 403)

  const { data, error: qError } = await supabase
    .from('prompt_history')
    .select('*, profiles:edited_by(nickname)')
    .eq('prompt_id', id)
    .order('created_at', { ascending: false })

  if (qError) return errorResponse(qError.message, 400)
  return successResponse(data)
}
