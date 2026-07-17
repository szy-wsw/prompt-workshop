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

export async function safeSupabaseQuery<T>(
  builder: any
): Promise<SafeResult<T>> {
  try {
    const { data, error } = await Promise.resolve(builder)

    if (error) {
      return { success: false, data: null, error }
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

class QueryBuilder {
  private table: string
  private selectColumns: string = '*'
  private filters: any[] = []
  private orderBy: string | null = null
  private rangeStart: number | null = null
  private rangeEnd: number | null = null
  private isCount: boolean = false
  private isHead: boolean = false

  constructor(table: string) {
    this.table = table
  }

  select(columns: string = '*', options: any = {}) {
    this.selectColumns = columns
    if (options?.count === 'exact') {
      this.isCount = true
    }
    if (options?.head) {
      this.isHead = true
    }
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  ilike(column: string, value: any) {
    this.filters.push({ type: 'ilike', column, value })
    return this
  }

  contains(column: string, value: any) {
    this.filters.push({ type: 'contains', column, value })
    return this
  }

  order(column: string, _options: any = {}) {
    this.orderBy = column
    return this
  }

  range(start: number, end: number) {
    this.rangeStart = start
    this.rangeEnd = end
    return this
  }

  async execute() {
    if (this.table === 'prompts') {
      const params: string[] = []

      for (const filter of this.filters) {
        if (filter.type === 'eq') {
          if (filter.column === 'author_id') {
            params.push(`user_id=${encodeURIComponent(filter.value)}`)
          } else if (filter.column === 'visibility') {
            params.push(`visibility=${encodeURIComponent(filter.value)}`)
          } else if (filter.column === 'id') {
            params.push(`prompt_id=${encodeURIComponent(filter.value)}`)
          }
        } else if (filter.type === 'ilike') {
          params.push(`search=${encodeURIComponent(filter.value.replace(/%/g, ''))}`)
        } else if (filter.type === 'contains') {
          params.push(`tag=${encodeURIComponent(filter.value[0])}`)
        }
      }

      if (this.rangeStart !== null && this.rangeEnd !== null) {
        const perPage = this.rangeEnd - this.rangeStart + 1
        const page = Math.floor(this.rangeStart / perPage) + 1
        params.push(`page=${page}&per_page=${perPage}`)
      }

      const url = `/api/prompts${params.length > 0 ? `?${params.join('&')}` : ''}`
      const result = await safeFetch(url)

      if (this.isCount && this.isHead) {
        return { data: { count: (result as any).total || 0 }, error: null }
      }

      return { data: result.data, error: result.error }
    }

    if (this.table === 'collections') {
      const params: string[] = []
      let userId = ''

      for (const filter of this.filters) {
        if (filter.type === 'eq' && filter.column === 'user_id') {
          userId = filter.value
        }
      }

      if (userId) {
        params.push(`user_id=${encodeURIComponent(userId)}`)
      }

      if (this.rangeStart !== null && this.rangeEnd !== null) {
        const perPage = this.rangeEnd - this.rangeStart + 1
        const page = Math.floor(this.rangeStart / perPage) + 1
        params.push(`page=${page}&per_page=${perPage}`)
      }

      const url = `/api/collections${params.length > 0 ? `?${params.join('&')}` : ''}`
      const result = await safeFetch(url)
      return { data: result.data, error: result.error }
    }

    return { data: [], error: '不支持的表' }
  }
}

class TableBuilder {
  private table: string

  constructor(table: string) {
    this.table = table
  }

  select(columns: string = '*', options: any = {}) {
    return new QueryBuilder(this.table).select(columns, options)
  }

  insert(data: any) {
    return {
      execute: async () => {
        if (this.table === 'prompts') {
          const result = await safeFetch('/api/prompts', {
            method: 'POST',
            body: JSON.stringify(data)
          })
          return { data: result.data, error: result.error }
        }
        return { data: null, error: '不支持的操作' }
      }
    }
  }

  update(data: any) {
    return {
      eq: (column: string, value: any) => ({
        execute: async () => {
          if (this.table === 'prompts' && column === 'id') {
            const result = await safeFetch(`/api/prompts/${value}`, {
              method: 'PUT',
              body: JSON.stringify(data)
            })
            return { data: result.data, error: result.error }
          }
          return { data: null, error: '不支持的操作' }
        }
      })
    }
  }

  delete() {
    return {
      eq: (column: string, value: any) => ({
        execute: async () => {
          if (this.table === 'prompts' && column === 'id') {
            const result = await safeFetch(`/api/prompts/${value}`, {
              method: 'DELETE'
            })
            return { data: result.data, error: result.error }
          }
          return { data: null, error: '不支持的操作' }
        }
      })
    }
  }
}

export const supabase: any = {
  from: (table: string) => new TableBuilder(table),
  auth: {
    getUser: () => {
      const userStr = localStorage.getItem('auth_user')
      const token = localStorage.getItem('auth_token')
      if (userStr && token) {
        try {
          const user = JSON.parse(userStr)
          return { data: { user }, error: null }
        } catch {
          return { data: { user: null }, error: null }
        }
      }
      return { data: { user: null }, error: null }
    }
  }
}
