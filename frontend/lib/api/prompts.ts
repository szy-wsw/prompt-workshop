import { PromptItem } from "@/types/prompt"
const BASE_URL = "http://127.0.0.1:5000/api/prompts"

// 获取全部
export async function getPrompts(): Promise<PromptItem[]> {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error("请求失败")
  return res.json()
}

// 新增
export async function createPrompt(data: Omit<PromptItem, "id" | "created_at">) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("新增失败")
  return res.json()
}

// 修改
export async function updatePrompt(id: number, data: Omit<PromptItem, "id" | "created_at">) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("修改失败")
  return res.json()
}

// 删除
export async function delPrompt(id: number) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("删除失败")
  return res.json()
}