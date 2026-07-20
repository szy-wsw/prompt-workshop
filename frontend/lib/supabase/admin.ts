import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let adminClient: SupabaseClient | null = null

if (supabaseUrl && serviceRoleKey) {
  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
} else {
  console.error('[Supabase Admin] 环境变量缺失！请检查 NEXT_PUBLIC_SUPABASE_URL')
}

export function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    throw new Error('Supabase admin client not initialized. Check environment variables')
  }
  return adminClient
}

export { adminClient }
