export interface UserProfile {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
  created_at: string
}

export interface UserStats {
  prompt_count: number
  like_count: number
  collection_count: number
}