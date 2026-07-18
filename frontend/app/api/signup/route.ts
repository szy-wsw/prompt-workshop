import { tcbDbQuery, tcbDbAdd, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'
import crypto from 'crypto'

export const runtime = 'nodejs'

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

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

    const existingUsers = await tcbDbQuery('users', { email })
    if (existingUsers.length > 0) {
      return errorResponse('该邮箱已注册，请直接登录')
    }

    const salt = generateSalt()
    const hashedPassword = hashPassword(password, salt)
    const now = new Date().toISOString()

    await tcbDbAdd('users', {
      email,
      password: hashedPassword,
      salt,
      nickname,
      avatar_url: '',
      created_at: now,
      updated_at: now,
    })

    return successResponse(null, '注册成功，请登录')
  } catch (e) {
    return errorResponse(`注册失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
