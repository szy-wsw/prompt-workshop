import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8')
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && !key.startsWith('#') && rest.length > 0) {
    process.env[key.trim()] = rest.join('=').trim()
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service key length:', serviceKey?.length || 0)

const supabase = createClient(supabaseUrl, serviceKey)

// 检查所有表
const tables = ['users', 'prompts', 'prompt_history', 'likes', 'collections', 'chat_history', 'templates']

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: OK (${data.length} rows)`)
    }
  } catch (e) {
    console.log(`❌ ${table}: ${e.message}`)
  }
}

// 检查 storage bucket
try {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) {
    console.log(`\n❌ Storage: ${error.message}`)
  } else {
    console.log(`\n✅ Storage buckets:`, buckets.map(b => b.name).join(', '))
    const hasAvatars = buckets.some(b => b.name === 'avatars')
    console.log(`   avatars bucket: ${hasAvatars ? '存在' : '不存在'}`)
  }
} catch (e) {
  console.log(`\n❌ Storage error: ${e.message}`)
}
