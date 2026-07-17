import { getSupabaseServer, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { id } = await params
  const supabase = getSupabaseServer()

  const { data: existing } = await supabase.from('prompts').select('*').eq('id', id).single()
  if (!existing) return errorResponse('提示词不存在', 404)
  if (existing.author_id !== userId) return errorResponse('无权限修改', 403)

  const body = await req.json()
  const { data, error: updError } = await supabase.from('prompts').update({
    title: body.title,
    content: body.content,
    tags: body.tags,
    visibility: body.visibility,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (updError) return errorResponse(updError.message, 400)

  await supabase.from('prompt_history').insert({
    prompt_id: id,
    title: body.title,
    content: body.content,
    tags: body.tags,
    visibility: body.visibility,
    edited_by: userId,
  })

  return successResponse(data, '更新成功')
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { id } = await params
  const supabase = getSupabaseServer()

  const { data: existing } = await supabase.from('prompts').select('*').eq('id', id).single()
  if (!existing) return errorResponse('提示词不存在', 404)
  if (existing.author_id !== userId) return errorResponse('无权限删除', 403)

  await supabase.from('prompt_history').delete().eq('prompt_id', id)
  await supabase.from('likes').delete().eq('prompt_id', id)
  await supabase.from('collections').delete().eq('prompt_id', id)
  const { error: delError } = await supabase.from('prompts').delete().eq('id', id)

  if (delError) return errorResponse(delError.message, 400)
  return successResponse(null, '删除成功')
}
