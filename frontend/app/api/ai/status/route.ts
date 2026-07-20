import { AI_API_KEY, FREE_MODEL_ID, successResponse } from '@/lib/supabase-server'

export async function GET() {
  if (!AI_API_KEY) {
    return successResponse({ online: false, message: 'AI服务未配置，请设置 AI_API_KEY', models: [] })
  }

  return successResponse({ 
    online: true, 
    message: 'AI服务在线', 
    models: ['deepseek-ai/DeepSeek-V4-Flash', 'THUDM/GLM-4-9B-0414', 'Qwen/Qwen2.5-7B-Instruct'],
    defaultModel: FREE_MODEL_ID 
  })
}