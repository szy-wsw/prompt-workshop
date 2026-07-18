export {
  tcbDbQuery,
  tcbDbAdd,
  tcbDbUpdate,
  tcbDbDelete,
  tcbDbCount,
  tcbDbGetOne,
  jsonResponse,
  successResponse,
  errorResponse,
  handleOptions,
  generateToken,
  verifyToken,
  verifyAuth,
  SILICONFLOW_API_KEY,
  SILICONFLOW_BASE_URL,
  FREE_MODEL_ID,
} from './tcb-server'

export function getSupabaseServer() {
  throw new Error('Supabase has been replaced by TCB')
}
