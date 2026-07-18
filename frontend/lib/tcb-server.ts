import crypto from 'crypto'
import cloudbase from '@cloudbase/node-sdk'
import {
  memoryDbQuery,
  memoryDbAdd,
  memoryDbUpdate,
  memoryDbDelete,
  memoryDbCount,
  memoryDbGetOne,
} from './memory-db'

const TCB_ENV_ID = process.env.TCB_ENV_ID || ''

let tcbInstance: any = null

function getTcbInstance() {
  if (!tcbInstance && TCB_ENV_ID) {
    try {
      tcbInstance = cloudbase.init({
        env: TCB_ENV_ID,
      })
    } catch (e) {
      console.error('TCB init failed:', e)
    }
  }
  return tcbInstance
}

const USE_TCB = !!TCB_ENV_ID && process.env.NODE_ENV === 'production'

export async function tcbDbQuery<T>(
  collection: string,
  query: Record<string, unknown> = {},
  options: { 
    limit?: number; 
    offset?: number; 
    orderBy?: string; 
    orderDirection?: 'asc' | 'desc';
    searchFields?: string[];
    searchValue?: string;
    containsField?: string;
    containsValue?: any;
  } = {}
): Promise<T[]> {
  if (USE_TCB) {
    const tcb = getTcbInstance()
    if (!tcb) return memoryDbQuery<T>(collection, query, options)
    
    const db = tcb.database()
    let result = db.collection(collection).where(query as any)
    
    if (options.orderBy) {
      result = result.orderBy(options.orderBy, options.orderDirection || 'desc')
    }
    if (options.offset) {
      result = result.skip(options.offset)
    }
    if (options.limit) {
      result = result.limit(options.limit)
    }
    
    try {
      const { data } = await result.get()
      return data.map((item: any) => ({ ...item, id: item._id || item.id })) as T[]
    } catch (e) {
      console.error('TCB query error:', e)
      return memoryDbQuery<T>(collection, query, options)
    }
  }
  return memoryDbQuery<T>(collection, query, options)
}

export async function tcbDbAdd<T>(
  collection: string,
  data: Record<string, unknown>
): Promise<T> {
  if (USE_TCB) {
    const tcb = getTcbInstance()
    if (!tcb) return memoryDbAdd<T>(collection, data)
    
    const db = tcb.database()
    try {
      const { _id } = await db.collection(collection).add({ data })
      return { _id, ...data } as T
    } catch (e) {
      console.error('TCB add error:', e)
      return memoryDbAdd<T>(collection, data)
    }
  }
  return memoryDbAdd<T>(collection, data)
}

export async function tcbDbUpdate<T>(
  collection: string,
  query: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<T> {
  if (USE_TCB) {
    const tcb = getTcbInstance()
    if (!tcb) return memoryDbUpdate<T>(collection, query, data)
    
    const db = tcb.database()
    try {
      const { stats } = await db.collection(collection).where(query as any).update({ data })
      return { updated: stats.updated } as T
    } catch (e) {
      console.error('TCB update error:', e)
      return memoryDbUpdate<T>(collection, query, data)
    }
  }
  return memoryDbUpdate<T>(collection, query, data)
}

export async function tcbDbDelete(
  collection: string,
  query: Record<string, unknown>
): Promise<void> {
  if (USE_TCB) {
    const tcb = getTcbInstance()
    if (!tcb) return memoryDbDelete(collection, query)
    
    const db = tcb.database()
    try {
      await db.collection(collection).where(query as any).remove()
    } catch (e) {
      console.error('TCB delete error:', e)
      return memoryDbDelete(collection, query)
    }
  }
  return memoryDbDelete(collection, query)
}

export async function tcbDbCount(
  collection: string,
  query: Record<string, unknown> = {}
): Promise<number> {
  if (USE_TCB) {
    const tcb = getTcbInstance()
    if (!tcb) return memoryDbCount(collection, query)
    
    const db = tcb.database()
    try {
      const { total } = await db.collection(collection).where(query as any).count()
      return total
    } catch (e) {
      console.error('TCB count error:', e)
      return memoryDbCount(collection, query)
    }
  }
  return memoryDbCount(collection, query)
}

export async function tcbDbGetOne<T>(
  collection: string,
  query: Record<string, unknown>
): Promise<T | null> {
  if (USE_TCB) {
    const tcb = getTcbInstance()
    if (!tcb) return memoryDbGetOne<T>(collection, query)
    
    const db = tcb.database()
    try {
      const { data } = await db.collection(collection).where(query as any).limit(1).get()
      if (data.length > 0) {
        return { ...data[0], id: data[0]._id || data[0].id } as T
      }
      return null
    } catch (e) {
      console.error('TCB getOne error:', e)
      return memoryDbGetOne<T>(collection, query)
    }
  }
  return memoryDbGetOne<T>(collection, query)
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