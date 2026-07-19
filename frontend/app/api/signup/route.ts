import { dbQuery, dbAdd, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'
import { generateSalt, hashPassword, validatePassword, validateEmail, nowISO } from '@/lib/password'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  try {
    const { nickname, email, password } = await req.json()

    if (!nickname?.trim() || nickname.trim().length < 2)
      return errorResponse('昵称至少2个字符')
    if (!validateEmail(email))
      return errorResponse('邮箱格式不正确')
    
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid)
      return errorResponse(passwordValidation.message || '密码格式不正确')

    try {
      const existingUsers = await dbQuery('users', { email })
      
      if (existingUsers.length > 0) {
        return errorResponse('该邮箱已注册，请直接登录')
      }
    } catch (dbError) {
      console.error('Database Query Error:', dbError)
      return errorResponse(`数据库查询失败: ${dbError instanceof Error ? dbError.message : '未知错误'}`)
    }

    const salt = generateSalt()
    const hashedPassword = hashPassword(password, salt)
    const now = nowISO()

    try {
      await dbAdd('users', {
        email,
        password: hashedPassword,
        salt,
        nickname,
        avatar_url: '',
        created_at: now,
        updated_at: now,
      })
    } catch (dbError) {
      console.error('Database Add Error:', dbError)
      return errorResponse(`数据库写入失败: ${dbError instanceof Error ? dbError.message : '未知错误'}`)
    }

    return successResponse(null, '注册成功，请登录')
  } catch (e) {
    return errorResponse(`注册失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
