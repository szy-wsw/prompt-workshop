import { tcbDbQuery, tcbDbUpdate, tcbDbDelete, tcbDbAdd, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { id } = await params

  const prompts = await tcbDbQuery('prompts', { id: id }, { limit: 1 })
  const existing = prompts[0] as any
  if (!existing) return errorResponse('提示词不存在', 404)
  if (existing.author_id !== userId) return errorResponse('无权限修改', 403)

  const body = await req.json()
  const now = new Date().toISOString()

  await tcbDbUpdate('prompts', { id: id }, {
    title: body.title,
    content: body.content,
    tags: body.tags,
    visibility: body.visibility,
    updated_at: now,
  })

  await tcbDbAdd('prompt_history', {
    prompt_id: id,
    title: body.title,
    content: body.content,
    tags: body.tags,
    visibility: body.visibility,
    edited_by: userId,
    created_at: now,
  })

  return successResponse(null, '更新成功')
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const { id } = await params

  const prompts = await tcbDbQuery('prompts', { id: id }, { limit: 1 })
  const existing = prompts[0] as any
  if (!existing) return errorResponse('提示词不存在', 404)
  if (existing.author_id !== userId) return errorResponse('无权限删除', 403)

  await tcbDbDelete('prompt_history', { prompt_id: id })
  await tcbDbDelete('likes', { prompt_id: id })
  await tcbDbDelete('collections', { prompt_id: id })
  await tcbDbDelete('prompts', { id: id })

  return successResponse(null, '删除成功')
}
