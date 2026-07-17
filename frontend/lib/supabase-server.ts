import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function getSupabaseServer() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function successResponse(data: unknown = null, message = '操作成功') {
  return jsonResponse({ success: true, message, data })
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, message, data: null }, status)
}

export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function verifyAuth(req: Request): Promise<{ userId: string; error?: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { userId: '', error: '请先登录' }
  }
  const token = authHeader.replace('Bearer ', '')
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      return { userId: '', error: '登录已过期，请重新登录' }
    }
    return { userId: data.user.id }
  } catch {
    return { userId: '', error: '登录验证失败' }
  }
}

export const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY!
export const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1'
export const FREE_MODEL_ID = process.env.FREE_MODEL_ID || 'Qwen/Qwen2.5-7B-Instruct'
