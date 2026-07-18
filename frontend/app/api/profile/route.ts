import {
  tcbDbUpdate,
  tcbDbQuery,
  tcbDbGetOne,
  verifyAuth,
  successResponse,
  errorResponse,
  handleOptions,
  uploadFileToCloud,
  getPublicFileUrl,
  deleteCloudFile,
} from '@/lib/supabase-server'
import crypto from 'crypto'

export const runtime = 'nodejs'

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

export async function OPTIONS() {
  return handleOptions()
}

export async function PUT(req: Request) {
  const { userId, error } = await verifyAuth(req)
  if (error) return errorResponse(error, 401)

  const body = await req.json()

  if (body.nickname) {
    await tcbDbUpdate('users', { id: userId }, {
      nickname: body.nickname,
      updated_at: new Date().toISOString(),
    })
    const users = await tcbDbQuery('users', { id: userId }, { limit: 1 })
    const user = users[0] as any
    return successResponse({ 
      id: user.id, 
      email: user.email, 
      nickname: user.nickname, 
      avatar_url: user.avatar_url || '' 
    }, '昵称更新成功')
  }

  if (body.old_password && body.new_password) {
    const users = await tcbDbQuery('users', { id: userId }, { limit: 1 })
    if (users.length === 0) return errorResponse('用户不存在')
    const user = users[0] as any

    const oldHashed = hashPassword(body.old_password, user.salt)
    if (oldHashed !== user.password) {
      return errorResponse('当前密码不正确')
    }

    if (body.new_password.length < 6) {
      return errorResponse('新密码至少6位')
    }

    const newSalt = generateSalt()
    const newHashedPassword = hashPassword(body.new_password, newSalt)

    await tcbDbUpdate('users', { id: userId }, {
      password: newHashedPassword,
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

  try {
    const formData = await req.formData()
    const file = formData.get('avatar') as File
    if (!file) return errorResponse('未选择文件')

    const mimeType = file.type || ''
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return errorResponse('仅支持 JPG/PNG/WebP 格式图片')
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return errorResponse('图片大小不能超过 2MB')
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return errorResponse('文件扩展名不支持，仅支持 jpg/png/webp')
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const timestamp = Date.now()
    const fileName = `${timestamp}.${ext === 'jpeg' ? 'jpg' : ext}`
    const filePath = `avatars/${userId}/${fileName}`

    await uploadFileToCloud('avatars', filePath, fileBuffer, mimeType)

    const avatarUrl = getPublicFileUrl('avatars', filePath)

    try {
      const oldUser = await tcbDbGetOne<any>('users', { id: userId })
      if (oldUser?.avatar_path) {
        await deleteCloudFile('avatars', oldUser.avatar_path)
      }
    } catch (e) {
      console.error('[Avatar] 旧头像清理失败:', e)
    }

    await tcbDbUpdate('users', { id: userId }, {
      avatar: avatarUrl,
      avatar_url: avatarUrl,
      avatar_path: filePath,
      updated_at: new Date().toISOString(),
    })

    return successResponse({ avatar_url: avatarUrl }, '头像上传成功')
  } catch (e) {
    console.error('[Avatar Upload] 错误:', e)
    return errorResponse(`头像上传失败: ${e instanceof Error ? e.message : '未知错误'}`)
  }
}
