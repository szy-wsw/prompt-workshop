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
    return { success: true, data: data.data, error: null }
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
      } else {
        message = error || '请求失败'
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

class QueryBuilder {
  private table: string
  private selectColumns: string = '*'
  private filters: any[] = []
  private orderBy: string | null = null
  private orderDirection: boolean = false
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

  order(column: string, options: any = {}) {
    this.orderBy = column
    this.orderDirection = options?.ascending || false
    return this
  }

  range(start: number, end: number) {
    this.rangeStart = start
    this.rangeEnd = end
    return this
  }

  limit(count: number) {
    this.rangeStart = 0
    this.rangeEnd = count - 1
    return this
  }

  single() {
    this.rangeStart = 0
    this.rangeEnd = 0
    return this
  }

  async execute() {
    const token = localStorage.getItem('auth_token')
    let url = `/api/${this.table}`
    const params: string[] = []

    for (const filter of this.filters) {
      if (filter.type === 'eq') {
        if (filter.column === 'author_id') {
          params.push(`user_id=${encodeURIComponent(filter.value)}`)
        } else if (filter.column === 'visibility') {
          params.push(`visibility=${encodeURIComponent(filter.value)}`)
        } else if (filter.column === 'id') {
          params.push(`prompt_id=${encodeURIComponent(filter.value)}`)
        } else {
          params.push(`${filter.column}=${encodeURIComponent(filter.value)}`)
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

    if (params.length > 0) {
      url += `?${params.join('&')}`
    }

    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    const result = await response.json()

    if (result.success) {
      return { data: result.data || [], error: null }
    } else {
      return { data: [], error: result.message || '请求失败' }
    }
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
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`/api/${this.table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(data)
        })
        const result = await response.json()
        return { data: result.data || [], error: result.success ? null : result.message }
      }
    }
  }

  update(data: any) {
    return {
      eq: (column: string, value: any) => ({
        execute: async () => {
          const token = localStorage.getItem('auth_token')
          const response = await fetch(`/api/${this.table}/${value}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          return { data: null, error: result.success ? null : result.message }
        }
      })
    }
  }

  delete() {
    return {
      eq: (column: string, value: any) => ({
        execute: async () => {
          const token = localStorage.getItem('auth_token')
          const response = await fetch(`/api/${this.table}/${value}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
          const result = await response.json()
          return { data: null, error: result.success ? null : result.message }
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