import { getSupabaseServer, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'edge'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email?.trim()) return errorResponse('请输入邮箱')
    if (!password) return errorResponse('请输入密码')

    const supabase = getSupabaseServer()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      const msg = error?.message?.toLowerCase() || ''
      if (msg.includes('invalid') || msg.includes('credentials'))
        return errorResponse('邮箱或密码错误')
      return errorResponse(error?.message || '登录失败')
    }

    const nickname = data.user.user_metadata?.nickname || '用户'

    return successResponse({
      user: { id: data.user.id, email: data.user.email, nickname },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    }, '登录成功')
  } catch (e) {
    return errorResponse(`登录失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
