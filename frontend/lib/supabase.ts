'use client'

export interface SafeResult<T = any> {
  success: boolean
  data: T | null
  error: string | null
}

export async function safeFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<SafeResult<T>> {
  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      }
    })

    const body = await response.json()

    if (!response.ok) {
      let message = body.message || `请求失败 (${response.status})`
      return { success: false, data: null, error: message }
    }

    return { success: true, data: body.data || null, error: null }
  } catch (e: any) {
    console.error('Fetch Error:', e)
    return {
      success: false,
      data: null,
      error: '网络连接异常，请检查网络后重试'
    }
  }
}
