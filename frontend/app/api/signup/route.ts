import { getSupabaseServer, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  try {
    const { nickname, email, password } = await req.json()

    if (!nickname?.trim() || nickname.trim().length < 2)
      return errorResponse('昵称至少2个字符')
    if (!email?.trim() || !email.includes('@') || !email.includes('.'))
      return errorResponse('邮箱格式不正确')
    if (!password || password.length < 6)
      return errorResponse('密码至少6位')

    const supabase = getSupabaseServer()
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { nickname },
      email_confirm: true,
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists'))
        return errorResponse('该邮箱已注册，请直接登录')
      if (msg.includes('password'))
        return errorResponse('密码不符合安全要求')
      return errorResponse(error.message)
    }

    return successResponse(null, '注册成功，请登录')
  } catch (e) {
    return errorResponse(`注册失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
