export interface PromptItem {
  id: string
  title: string
  content: string
  category: string
  visibility: 'private' | 'public'
  is_starred: boolean
  tags: string[]
  like_count: number
  author_id: string
  author_name: string
  created_at: string
  updated_at: string
}

export interface PromptHistory {
  id: string
  prompt_id: string
  title: string
  content: string
  version: number
  created_at: string
}