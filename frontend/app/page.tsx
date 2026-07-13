"use client"
import { useEffect, useState } from "react"
import { PromptItem } from "@/types/prompt"
import { getPrompts, createPrompt, updatePrompt, delPrompt } from "@/lib/api/prompts"
import Modal from "@/components/Modal"
import PromptForm from "@/components/PromptForm"
import ThemeToggle from "./ThemeToggle"
import { useTheme } from "./useTheme"

export default function Home() {
  const { palette } = useTheme()
  const [list, setList] = useState<PromptItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const pageSize = 5
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<PromptItem | null>(null)
  const [delConfirmId, setDelConfirmId] = useState<number | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getPrompts()
      setList(res)
    } catch (e) {
      alert("加载列表失败")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadData() }, [])

  // 搜索过滤
  const filterList = list.filter(item => item.title.includes(search) || item.category.includes(search))
  // 分页切片
  const pageTotal = Math.ceil(filterList.length / pageSize)
  const pageData = filterList.slice((page - 1) * pageSize, page * pageSize)

  // 新增提交
  const handleAdd = async (val: Omit<PromptItem, "id" | "created_at">) => {
    await createPrompt(val)
    setModalOpen(false)
    loadData()
  }
  // 编辑提交
  const handleEdit = async (val: Omit<PromptItem, "id" | "created_at">) => {
    if (!editItem) return
    await updatePrompt(editItem.id, val)
    setModalOpen(false)
    setEditItem(null)
    loadData()
  }
  // 删除
  const handleDel = async (id: number) => {
    await delPrompt(id)
    setDelConfirmId(null)
    loadData()
  }

  // 打开新增弹窗
  const openAdd = () => {
    setEditItem(null)
    setModalOpen(true)
  }
  // 打开编辑弹窗
  const openEdit = (row: PromptItem) => {
    setEditItem(row)
    setModalOpen(true)
  }

  return (
    <div style={{ minHeight: "100vh", padding: "24px" }}>
      {/* 顶部导航 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>AI 提示词管理工坊</h1>
        <ThemeToggle />
      </div>

      {/* 搜索+新增按钮行 */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }} className="card">
        <input
          placeholder="搜索标题/分类"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${palette.border}` }}
        />
        <button onClick={openAdd} className="btn-primary">+ 新增提示词</button>
      </div>

      {/* 列表卡片 */}
      <div className="card">
        <h3 style={{ margin: "0 0 16px 0" }}>全部提示词列表</h3>
        {loading ? <p>加载中...</p> : pageData.length === 0 ? <p>暂无数据</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pageData.map(row => (
              <div key={row.id} style={{ borderBottom: `1px solid ${palette.border}`, paddingBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0" }}>{row.title}</h4>
                    <p style={{ margin: "0 0 6px 0", color: palette.textMuted }}>{row.content}</p>
                    <span style={{ fontSize: 13, color: palette.textMuted }}>
                      分类：{row.category} | 创建时间：{row.created_at}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(row)} className="btn-gray">编辑</button>
                    <button onClick={() => setDelConfirmId(row.id)} className="btn-danger">删除</button>
                  </div>
                </div>
                {/* 删除二次确认 */}
                {delConfirmId === row.id && (
                  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                    <span>确定删除这条提示词？</span>
                    <button onClick={() => handleDel(row.id)} className="btn-danger">确认删除</button>
                    <button onClick={() => setDelConfirmId(null)} className="btn-gray">取消</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {pageTotal > 1 && (
          <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-gray">上一页</button>
            <span>第 {page} / {pageTotal} 页</span>
            <button disabled={page >= pageTotal} onClick={() => setPage(p => p + 1)} className="btn-gray">下一页</button>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal open={modalOpen} title={editItem ? "编辑提示词" : "新增提示词"} onClose={() => setModalOpen(false)}>
        <PromptForm init={editItem} onSubmit={editItem ? handleEdit : handleAdd} />
      </Modal>
    </div>
  )
}