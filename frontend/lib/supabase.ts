import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pzoaapugzruzanjvjbim.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Gh2XAJKQIS0UaQuOsqx1rQ_WCc97WtM'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase配置缺失，请检查环境变量')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export interface SafeResult<T = any> {
  success: boolean
  data: T | null
  error: string | null
}

export async function safeSupabaseQuery<T>(
  builder: any
): Promise<SafeResult<T>> {
  try {
    const { data, error } = await Promise.resolve(builder)

    if (error) {
      console.error('Supabase Error:', error)
      let message = '请求失败'

      if (error.code) {
        switch (error.code) {
          case '42501':
            message = '权限不足，请登录后重试'
            break
          case 'PGRST116':
            message = '数据不存在'
            break
          case '23505':
            message = '数据已存在'
            break
          case '08006':
            message = '数据库连接失败，请稍后重试'
            break
          case 'P0001':
            message = '操作异常'
            break
          case 'ECONNREFUSED':
            message = '网络连接失败，请检查网络'
            break
          default:
            message = error.message || '请求失败'
        }
      }

      return { success: false, data: null, error: message }
    }

    return { success: true, data, error: null }
  } catch (e: any) {
    console.error('Network Error:', e)
    return {
      success: false,
      data: null,
      error: '网络连接异常，请检查网络后重试'
    }
  }
}

export async function safeFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<SafeResult<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      let message = `请求失败 (${response.status})`
      try {
        const body = await response.json()
        if (body.message) {
          message = body.message
        }
      } catch {
        message = '请求失败，请稍后重试'
      }
      return { success: false, data: null, error: message }
    }

    const data = await response.json()
    return { success: true, data, error: null }
  } catch (e: any) {
    console.error('Fetch Error:', e)
    return {
      success: false,
      data: null,
      error: '网络连接异常，请检查网络后重试'
    }
  }
}
