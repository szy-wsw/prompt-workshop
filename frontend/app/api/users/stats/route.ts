import { dbCount, verifyAuth, successResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const targetUserId = url.searchParams.get('user_id')

  if (type === 'site') {
    const [totalPrompts, totalUsers, publicPrompts] = await Promise.all([
      dbCount('prompts', {}),
      dbCount('users', {}),
      dbCount('prompts', { visibility: 'public' }),
    ])

    return successResponse({
      totalPrompts,
      totalUsers,
      publicPrompts,
      totalChats: 0,
    })
  }

  const { userId, error } = await verifyAuth(req)
  if (error) {
    return successResponse({
      totalPrompts: 0,
      totalUsers: 0,
      publicPrompts: 0,
      totalChats: 0,
    })
  }

  const uid = targetUserId || userId

  const [totalPrompts, publicPrompts, totalCollections] = await Promise.all([
    dbCount('prompts', { author_id: uid }),
    dbCount('prompts', { author_id: uid, visibility: 'public' }),
    dbCount('collections', { user_id: uid }),
  ])

  return successResponse({
    totalPrompts,
    publicPrompts,
    totalCollections,
  })
}
