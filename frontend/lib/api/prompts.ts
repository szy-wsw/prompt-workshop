import { PromptItem } from '@/types/prompt'

const BASE_URL = '/api/prompts'

export async function getPrompts(): Promise<PromptItem[]> {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('请求失败')
  return res.json()
}

export async function getStarredPrompts(): Promise<PromptItem[]> {
  const res = await fetch(`${BASE_URL}?starred=true`)
  if (!res.ok) throw new Error('请求失败')
  return res.json()
}

export async function createPrompt(data: Omit<PromptItem, 'id' | 'created_at'>) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('新增失败')
  return res.json()
}

export async function updatePrompt(id: string, data: Omit<PromptItem, 'id' | 'created_at'>) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('修改失败')
  return res.json()
}

export async function delPrompt(id: string) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('删除失败')
  return res.json()
}

export async function toggleStar(id: string, isStarred: boolean) {
  const res = await fetch(`${BASE_URL}/${id}/star`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_starred: !isStarred })
  })
  if (!res.ok) throw new Error('操作失败')
  return res.json()
}
