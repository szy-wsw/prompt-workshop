import { SILICONFLOW_API_KEY, SILICONFLOW_BASE_URL, FREE_MODEL_ID, successResponse } from '@/lib/supabase-server'

export async function GET() {
  if (!SILICONFLOW_API_KEY) {
    return successResponse({ online: false, message: 'AI服务未配置，请设置 SILICONFLOW_API_KEY', models: [] })
  }

  try {
    const res = await fetch(`${SILICONFLOW_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (res.ok) {
      const modelData = await res.json()
      const models = (modelData.data || []).map((m: any) => m.id)
      return successResponse({ online: true, message: 'AI服务在线', models, defaultModel: FREE_MODEL_ID })
    } else {
      return successResponse({ online: false, message: `AI服务异常(${res.status})`, models: [], defaultModel: FREE_MODEL_ID })
    }
  } catch (e) {
    return successResponse({ online: false, message: 'AI服务连接失败', models: [], defaultModel: FREE_MODEL_ID })
  }
}