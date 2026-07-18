import { tcbDbQuery, successResponse, errorResponse, handleOptions, generateToken } from '@/lib/supabase-server'
import crypto from 'crypto'

export const runtime = 'nodejs'

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email?.trim()) return errorResponse('请输入邮箱')
    if (!password) return errorResponse('请输入密码')

    const users = await tcbDbQuery('users', { email })
    if (users.length === 0) {
      return errorResponse('邮箱或密码错误')
    }

    const user = users[0] as any
    const hashedPassword = hashPassword(password, user.salt)

    if (hashedPassword !== user.password) {
      return errorResponse('邮箱或密码错误')
    }

    const token = generateToken({ userId: user._id, email: user.email })
    const expiresAt = Math.floor(Date.now() / 1000) + 86400

    return successResponse({
      user: { id: user._id, email: user.email, nickname: user.nickname, avatar_url: user.avatar_url || '' },
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
