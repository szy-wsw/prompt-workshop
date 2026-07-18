import { tcbDbUpdate, tcbDbQuery, verifyAuth, successResponse, errorResponse, handleOptions } from '@/lib/supabase-server'
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

export async function PUT(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const body = await req.json()

  if (body.nickname) {
    await tcbDbUpdate('users', { _id: userId }, {
      nickname: body.nickname,
      updated_at: new Date().toISOString(),
    })
    return successResponse(null, '昵称更新成功')
  }

  if (body.password) {
    const users = await tcbDbQuery('users', { _id: userId }, { limit: 1 })
    if (users.length === 0) return errorResponse('用户不存在')

    const user = users[0] as any
    const newSalt = generateSalt()
    const hashedPassword = hashPassword(body.password, newSalt)

    await tcbDbUpdate('users', { _id: userId }, {
      password: hashedPassword,
      salt: newSalt,
      updated_at: new Date().toISOString(),
    })
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

  const ext = file.name.split('.').pop() || 'png'
  const path = `${userId}/avatar.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const avatar_url = `https://storage.googleapis.com/prompt-workshop-avatars/${path}`

  await tcbDbUpdate('users', { _id: userId }, {
    avatar_url,
    updated_at: new Date().toISOString(),
  })

  return successResponse({ avatar_url }, '头像上传成功')
}
