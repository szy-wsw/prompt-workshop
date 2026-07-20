import crypto from 'crypto'
import { getAdminClient } from './supabase/admin'

const JWT_SECRET = process.env.JWT_SECRET || 'prompt-workshop-jwt-secret-change-me'

export const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || ''
export const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1'
export const FREE_MODEL_ID = process.env.FREE_MODEL_ID || 'Qwen/Qwen2.5-7B-Instruct'

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
  const origin = process.env.NEXT_PUBLIC_APP_URL || '*'
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

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

interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  searchFields?: string[]
  searchValue?: string
  containsField?: string
  containsValue?: any
}

export async function dbQuery<T>(
  table: string,
  query: Record<string, unknown> = {},
  options: QueryOptions = {}
): Promise<T[]> {
  const supabase = getAdminClient() as any
  let builder: any = supabase.from(table).select('*')

  for (const [key, value] of Object.entries(query)) {
    if (key === '_id' || key === 'id') {
      if (Array.isArray(value)) {
        builder = builder.in('id', value)
      } else {
        builder = builder.eq('id', value)
      }
    } else {
      if (Array.isArray(value)) {
        builder = builder.in(key, value)
      } else {
        builder = builder.eq(key, value)
      }
    }
  }

  if (options.searchFields && options.searchValue) {
    const searchTerm = `%${options.searchValue}%`
    if (options.searchFields.length > 0) {
      const orConditions = options.searchFields.map(field => `${field}.ilike.${searchTerm}`).join(',')
      builder = builder.or(orConditions)
    }
  }

  if (options.containsField && options.containsValue) {
    builder = builder.contains(options.containsField, Array.isArray(options.containsValue) ? options.containsValue : [options.containsValue])
  }

  if (options.orderBy) {
    builder = builder.order(options.orderBy, { ascending: options.orderDirection === 'asc' })
  }

  if (options.offset !== undefined && options.limit !== undefined) {
    builder = builder.range(options.offset, options.offset + options.limit - 1)
  } else if (options.limit !== undefined) {
    builder = builder.limit(options.limit)
  }

  const { data, error } = await builder
  if (error) {
    console.error(`[Supabase Query Error] ${table}:`, error)
    return []
  }

  return (data || []).map((item: any) => ({ ...item, id: item.id || item._id })) as T[]
}

export async function dbAdd<T>(
  table: string,
  data: Record<string, unknown>
): Promise<T> {
  const supabase = getAdminClient() as any
  
  const insertData: Record<string, unknown> = { ...data }
  if (insertData._id) {
    delete insertData._id
  }

  const { data: result, error } = await supabase
    .from(table)
    .insert(insertData as any)
    .select()
    .single()

  if (error) {
    console.error(`[Supabase Insert Error] ${table}:`, error)
    throw error
  }

  return { ...(result as any), id: (result as any).id } as T
}

export async function dbUpdate<T>(
  table: string,
  query: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<{ updated: number }> {
  const supabase = getAdminClient() as any
  
  const updateData: Record<string, unknown> = { ...data }
  if (updateData._id) {
    delete updateData._id
  }

  let builder: any = supabase.from(table).update(updateData as any)

  for (const [key, value] of Object.entries(query)) {
    if (key === '_id' || key === 'id') {
      builder = builder.eq('id', value)
    } else {
      builder = builder.eq(key, value)
    }
  }

  const { error } = await builder

  if (error) {
    console.error(`[Supabase Update Error] ${table}:`, error)
    return { updated: 0 }
  }

  return { updated: 1 }
}

export async function dbIncrement(
  table: string,
  query: Record<string, unknown>,
  field: string,
  amount: number = 1
): Promise<{ updated: number }> {
  const supabase = getAdminClient() as any

  let builder: any = supabase.from(table).update({
    [field]: supabase.raw(`coalesce(${field}, 0) + ${amount}`)
  })

  for (const [key, value] of Object.entries(query)) {
    if (key === '_id' || key === 'id') {
      builder = builder.eq('id', value)
    } else {
      builder = builder.eq(key, value)
    }
  }

  const { error } = await builder

  if (error) {
    console.error(`[Supabase Increment Error] ${table}.${field}:`, error)
    return { updated: 0 }
  }

  return { updated: 1 }
}

export async function dbDelete(
  table: string,
  query: Record<string, unknown>
): Promise<number> {
  const supabase = getAdminClient() as any
  
  let builder: any = supabase.from(table).delete()

  for (const [key, value] of Object.entries(query)) {
    if (key === '_id' || key === 'id') {
      builder = builder.eq('id', value)
    } else {
      builder = builder.eq(key, value)
    }
  }

  const { error } = await builder

  if (error) {
    console.error(`[Supabase Delete Error] ${table}:`, error)
    return 0
  }

  return 1
}

export async function dbCount(
  table: string,
  query: Record<string, unknown> = {}
): Promise<number> {
  const supabase = getAdminClient() as any
  
  let builder: any = supabase.from(table).select('*', { count: 'exact', head: true })

  for (const [key, value] of Object.entries(query)) {
    if (key === '_id' || key === 'id') {
      builder = builder.eq('id', value)
    } else {
      builder = builder.eq(key, value)
    }
  }

  const { count, error } = await builder

  if (error) {
    console.error(`[Supabase Count Error] ${table}:`, error)
    return 0
  }

  return count || 0
}

export async function dbGetOne<T>(
  table: string,
  query: Record<string, unknown>
): Promise<T | null> {
  const result = await dbQuery<T>(table, query, { limit: 1 })
  return result[0] || null
}

export async function uploadFileToCloud(
  bucket: string,
  filePath: string,
  fileContent: Buffer,
  contentType: string = 'image/png'
): Promise<string> {
  const supabase = getAdminClient()
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileContent, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error('[Supabase Storage Upload Error]:', error)
    throw error
  }

  return filePath
}

export function getPublicFileUrl(bucket: string, filePath: string): string {
  const supabase = getAdminClient()
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteCloudFile(bucket: string, filePath: string): Promise<void> {
  const supabase = getAdminClient()
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) {
    console.error('[Supabase Storage Delete Error]:', error)
  }
}
