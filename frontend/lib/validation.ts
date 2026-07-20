import { errorResponse } from './supabase-server'

type ValidationRule = {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validator?: (value: any) => boolean
  message?: string
}

type ValidationSchema = Record<string, ValidationRule>

export async function validateRequest<T = any>(
  req: Request,
  schema: ValidationSchema
): Promise<{ data: T; errors: string[] } | null> {
  try {
    const data = await req.json()
    const errors: string[] = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field]

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(rules.message || `${field} 是必填项`)
        continue
      }

      if (value === undefined || value === null) continue

      if (rules.minLength !== undefined && String(value).length < rules.minLength) {
        errors.push(rules.message || `${field} 长度不能小于 ${rules.minLength}`)
      }

      if (rules.maxLength !== undefined && String(value).length > rules.maxLength) {
        errors.push(rules.message || `${field} 长度不能大于 ${rules.maxLength}`)
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(rules.message || `${field} 格式不正确`)
      }

      if (rules.validator && !rules.validator(value)) {
        errors.push(rules.message || `${field} 验证失败`)
      }
    }

    if (errors.length > 0) {
      return { data: data as T, errors }
    }

    return { data: data as T, errors: [] }
  } catch {
    return { data: {} as T, errors: ['请求体格式错误'] }
  }
}

export function validateAndRespond<T = any>(
  req: Request,
  schema: ValidationSchema
): Promise<Response | { data: T }> {
  return new Promise(async (resolve) => {
    const result = await validateRequest<T>(req, schema)
    
    if (result && result.errors.length > 0) {
      resolve(errorResponse(result.errors.join(', '), 400))
    } else {
      resolve({ data: result?.data ?? ({} as T) })
    }
  })
}

export const CommonRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '邮箱格式不正确'
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
    message: '密码至少8位，需要包含大小写字母和数字'
  },
  nickname: {
    required: true,
    minLength: 2,
    maxLength: 20,
    message: '昵称长度为2-20个字符'
  },
  title: {
    required: true,
    minLength: 1,
    maxLength: 200,
    message: '标题长度为1-200个字符'
  },
  content: {
    required: true,
    minLength: 1,
    maxLength: 10000,
    message: '内容长度为1-10000个字符'
  },
  promptId: {
    required: true,
    pattern: /^[a-f0-9-]{36}$/,
    message: '提示词ID格式不正确'
  },
  userId: {
    required: true,
    pattern: /^[a-f0-9-]{36}$/,
    message: '用户ID格式不正确'
  }
}