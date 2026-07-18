const cloud = require('wx-server-sdk')

cloud.init({
  env: process.env.TCB_ENV_ID || 'prompt-storage-d2gp4mcks061b539e',
})

const db = cloud.database()

exports.main = async (event) => {
  const { action, params } = event

  try {
    switch (action) {
      case 'query': {
        const { collection_name, query, limit, offset, orderBy } = params
        let result = db.collection(collection_name).where(query)
        if (orderBy) {
          result = result.orderBy(orderBy.field, orderBy.direction)
        }
        if (limit) {
          result = result.limit(limit)
        }
        if (offset) {
          result = result.skip(offset)
        }
        const { data } = await result.get()
        return { code: 0, message: 'success', data }
      }

      case 'add': {
        const { collection_name, record } = params
        const { _id } = await db.collection(collection_name).add({ data: record })
        return { code: 0, message: 'success', data: { ...record, _id } }
      }

      case 'update': {
        const { collection_name, query, update } = params
        const { stats } = await db.collection(collection_name).where(query).update({ data: update })
        return { code: 0, message: 'success', data: stats }
      }

      case 'delete': {
        const { collection_name, query } = params
        const { stats } = await db.collection(collection_name).where(query).remove()
        return { code: 0, message: 'success', data: stats }
      }

      case 'count': {
        const { collection_name, query } = params
        const { total } = await db.collection(collection_name).where(query).count()
        return { code: 0, message: 'success', data: { total } }
      }

      case 'aggregate': {
        const { collection_name, query, aggregate } = params
        let result = db.collection(collection_name).where(query)
        for (const stage of aggregate) {
          if (stage.$count) {
            const { list } = await result.count()
            return { code: 0, message: 'success', data: { list: [{ total: list }] } }
          }
        }
        return { code: 0, message: 'success', data: { list: [] } }
      }

      default:
        return { code: -1, message: `未知操作: ${action}`, data: null }
    }
  } catch (e) {
    console.error('DB Error:', e)
    return { code: -1, message: e.message || '数据库操作失败', data: null }
  }
}
