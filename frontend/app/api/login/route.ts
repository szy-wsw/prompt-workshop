import { dbQuery, successResponse, errorResponse, handleOptions, generateToken } from '@/lib/supabase-server'
import { verifyPassword, validateEmail } from '@/lib/password'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!validateEmail(email)) return errorResponse('请输入正确的邮箱')
    if (!password) return errorResponse('请输入密码')

    const users = await dbQuery('users', { email })
    if (users.length === 0) {
      return errorResponse('邮箱或密码错误')
    }

    const user = users[0] as any
    
    if (!verifyPassword(password, user.salt, user.password)) {
      return errorResponse('邮箱或密码错误')
    }

    const token = generateToken({ userId: user.id, email: user.email })
    const expiresAt = Math.floor(Date.now() / 1000) + 86400

    return successResponse({
      user: { id: user.id, email: user.email, nickname: user.nickname, avatar_url: user.avatar_url || '' },
      session: {
        access_token: token,
        refresh_token: '',
        expires_at: expiresAt,
      },
    }, '登录成功')
  } catch (e) {
    return errorResponse(`登录失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
