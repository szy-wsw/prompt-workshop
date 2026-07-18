type MemoryCollection = {
  [key: string]: Array<{ _id: string; [key: string]: unknown }>
}

const memoryDb: MemoryCollection = {
  users: [],
  prompts: [],
  prompt_history: [],
  likes: [],
  collections: [],
  chat_history: [],
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export async function memoryDbQuery<T>(
  collection: string,
  query: Record<string, unknown> = {},
  options: {
    limit?: number
    offset?: number
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
    searchFields?: string[]
    searchValue?: string
    containsField?: string
    containsValue?: any
  } = {}
): Promise<T[]> {
  let results = [...(memoryDb[collection] || [])]

  if (Object.keys(query).length > 0) {
    results = results.filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false
      }
      return true
    })
  }

  if (options.searchFields && options.searchValue) {
    const searchLower = options.searchValue.toLowerCase()
    const searchFields = options.searchFields
    results = results.filter(item => {
      return searchFields.some(field => {
        const val = String(item[field] || '')
        return val.toLowerCase().includes(searchLower)
      })
    })
  }

  if (options.containsField && options.containsValue) {
    const values = Array.isArray(options.containsValue) ? options.containsValue : [options.containsValue]
    const containsField = options.containsField
    results = results.filter(item => {
      const fieldValue = item[containsField]
      if (!Array.isArray(fieldValue)) return false
      return values.some(v => fieldValue.includes(v))
    })
  }

  if (options.orderBy) {
    const orderBy = options.orderBy
    const orderDirection = options.orderDirection || 'desc'
    results.sort((a, b) => {
      const aVal = a[orderBy] as any
      const bVal = b[orderBy] as any
      if (aVal < bVal) return orderDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return orderDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  if (options.offset) {
    results = results.slice(options.offset)
  }
  if (options.limit) {
    results = results.slice(0, options.limit)
  }

  return results as T[]
}

export async function memoryDbAdd<T>(
  collection: string,
  data: Record<string, unknown>
): Promise<T> {
  const item = { _id: generateId(), ...data } as { _id: string; [key: string]: unknown }
  if (!memoryDb[collection]) {
    memoryDb[collection] = []
  }
  memoryDb[collection].push(item)
  return item as T
}

export async function memoryDbUpdate<T>(
  collection: string,
  query: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<T> {
  const items = memoryDb[collection] || []
  let updated = 0

  for (let i = 0; i < items.length; i++) {
    let match = true
    for (const [key, value] of Object.entries(query)) {
      if (items[i][key] !== value) {
        match = false
        break
      }
    }
    if (match) {
      items[i] = { ...items[i], ...data }
      updated++
    }
  }

  return { updated } as T
}

export async function memoryDbDelete(
  collection: string,
  query: Record<string, unknown>
): Promise<void> {
  const items = memoryDb[collection] || []
  memoryDb[collection] = items.filter(item => {
    for (const [key, value] of Object.entries(query)) {
      if (item[key] !== value) return true
    }
    return false
  })
}

export async function memoryDbCount(
  collection: string,
  query: Record<string, unknown> = {}
): Promise<number> {
  let count = (memoryDb[collection] || []).length

  if (Object.keys(query).length > 0) {
    count = (memoryDb[collection] || []).filter(item => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false
      }
      return true
    }).length
  }

  return count
}

export async function memoryDbGetOne<T>(
  collection: string,
  query: Record<string, unknown>
): Promise<T | null> {
  const results = await memoryDbQuery<T>(collection, query, { limit: 1 })
  return results[0] || null
}
