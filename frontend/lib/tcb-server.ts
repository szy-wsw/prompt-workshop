import crypto from 'crypto'

const TCB_ENV_ID = process.env.TCB_ENV_ID!
const TCB_API_BASE = `https://${TCB_ENV_ID}.service.tcloudbase.com/http/invoke`

interface TcbResponse<T = any> {
  code: number
  message: string
  data: T
}

export async function tcbInvoke<T>(
  action: string,
  params: Record<string, unknown>
): Promise<TcbResponse<T>> {
  const res = await fetch(TCB_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-TCB-ENV': TCB_ENV_ID,
    },
    body: JSON.stringify({ action, params }),
  })
  return res.json()
}

export async function tcbDbQuery<T>(
  collection: string,
  query: Record<string, unknown> = {},
  options: { 
    limit?: number; 
    offset?: number; 
    orderBy?: string; 
    orderDirection?: 'asc' | 'desc';
    orConditions?: Record<string, unknown>[][];
    searchFields?: string[];
    searchValue?: string;
    containsField?: string;
    containsValue?: any;
  } = {}
): Promise<T[]> {
  const filter: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(query)) {
    filter[key] = { $eq: value }
  }

  if (options.orConditions && options.orConditions.length > 0) {
    filter['$or'] = options.orConditions.map(conds => {
      const orFilter: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(conds)) {
        orFilter[key] = { $regex: new RegExp(String(value), 'i') }
      }
      return orFilter
    })
  }

  if (options.searchFields && options.searchValue) {
    filter['$or'] = options.searchFields.map(field => ({
      [field]: { $regex: new RegExp(String(options.searchValue), 'i') }
    }))
  }

  if (options.containsField && options.containsValue) {
    filter[options.containsField] = { $all: Array.isArray(options.containsValue) ? options.containsValue : [options.containsValue] }
  }

  const params: Record<string, unknown> = {
    collection_name: collection,
    query: filter,
  }

  if (options.limit) params.limit = options.limit
  if (options.offset) params.offset = options.offset
  if (options.orderBy) {
    params.orderBy = [{ field: options.orderBy, direction: options.orderDirection || 'desc' }]
  }

  const res = await tcbInvoke<T[]>('database.query', params)
  if (res.code !== 0) throw new Error(res.message || 'TCB查询失败')
  return res.data || []
}

export async function tcbDbAdd<T>(
  collection: string,
  data: Record<string, unknown>
): Promise<T> {
  const params = {
    collection_name: collection,
    record: data,
  }

  const res = await tcbInvoke<T>('database.add', params)
  if (res.code !== 0) throw new Error(res.message || 'TCB插入失败')
  return res.data
}

export async function tcbDbUpdate<T>(
  collection: string,
  query: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<T> {
  const filter: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(query)) {
    filter[key] = { $eq: value }
  }

  const params = {
    collection_name: collection,
    query: filter,
    update: data,
  }

  const res = await tcbInvoke<T>('database.update', params)
  if (res.code !== 0) throw new Error(res.message || 'TCB更新失败')
  return res.data
}

export async function tcbDbDelete(
  collection: string,
  query: Record<string, unknown>
): Promise<void> {
  const filter: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(query)) {
    filter[key] = { $eq: value }
  }

  const params = {
    collection_name: collection,
    query: filter,
  }

  const res = await tcbInvoke('database.delete', params)
  if (res.code !== 0) throw new Error(res.message || 'TCB删除失败')
}

export async function tcbDbCount(
  collection: string,
  query: Record<string, unknown> = {}
): Promise<number> {
  const filter: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(query)) {
    filter[key] = { $eq: value }
  }

  const params = {
    collection_name: collection,
    query: filter,
    aggregate: [{ $count: { as: 'total' } }],
  }

  const res = await tcbInvoke<{ list: { total: number }[] }>('database.aggregate', params)
  if (res.code !== 0) throw new Error(res.message || 'TCB统计失败')
  return res.data?.list?.[0]?.total || 0
}

export async function tcbDbGetOne<T>(
  collection: string,
  query: Record<string, unknown>
): Promise<T | null> {
  const results = await tcbDbQuery<T>(collection, query, { limit: 1 })
  return results[0] || null
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

const JWT_SECRET = process.env.JWT_SECRET || 'prompt-workshop-tcb-secret'

export function generateToken(payload: Record<string, unknown>, expiresIn = '24h') {
  const exp = Math.floor(Date.now() / 1000) + (expiresIn === '24h' ? 86400 : 3600)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64')
  return `${header}.${body}.${signature}`
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const [header, body, signature] = token.split('.')
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64')

    if (signature !== expectedSignature) return null

    const payload = JSON.parse(Buffer.from(body, 'base64').toString())
    if (payload.exp && payload.exp < Date.now() / 1000) return null

    return payload
  } catch {
    return null
  }
}

export async function verifyAuth(req: Request): Promise<{ userId: string; error?: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { userId: '', error: '请先登录' }
  }
  const token = authHeader.replace('Bearer ', '')
  const payload = verifyToken(token)
  if (!payload || !payload.userId) {
    return { userId: '', error: '登录已过期，请重新登录' }
  }
  return { userId: String(payload.userId) }
}

export const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY!
export const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1'
export const FREE_MODEL_ID = process.env.FREE_MODEL_ID || 'Qwen/Qwen2.5-7B-Instruct'
