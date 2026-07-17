import { getSupabaseServer, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function PUT(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const body = await req.json()
  const supabase = getSupabaseServer()

  if (body.nickname) {
    const { error: updError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { nickname: body.nickname }
    })
    if (updError) return errorResponse(updError.message, 400)
    return successResponse(null, '昵称更新成功')
  }

  if (body.password) {
    const { error: updError } = await supabase.auth.admin.updateUserById(userId, {
      password: body.password
    })
    if (updError) return errorResponse(updError.message, 400)
    return successResponse(null, '密码更新成功')
  }

  return errorResponse('无更新内容')
}

export async function POST(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const formData = await req.formData()
  const file = formData.get('avatar') as File
  if (!file) return errorResponse('未选择文件')

  const supabase = getSupabaseServer()
  const ext = file.name.split('.').pop() || 'png'
  const path = `${userId}/avatar.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: upError } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (upError) return errorResponse(upError.message, 400)

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatar_url = urlData.publicUrl

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { avatar_url }
  })

  return successResponse({ avatar_url }, '头像上传成功')
}
