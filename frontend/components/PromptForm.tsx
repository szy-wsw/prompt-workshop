'use client'
import { useState } from 'react'
import { PromptItem } from '@/types/prompt'
import { useThemeContext } from '@/app/ThemeProvider'
import { supabase } from '@/lib/supabase'

type Props = {
  init?: PromptItem | null
  onSubmit: (val: Omit<PromptItem, 'id' | 'created_at'>) => Promise<void>
}

export default function PromptForm({ init, onSubmit }: Props) {
  const { palette } = useThemeContext()
  const [title, setTitle] = useState(init?.title || '')
  const [content, setContent] = useState(init?.content || '')
  const [category, setCategory] = useState(init?.category || '通用')
  const [tags, setTags] = useState(init?.tags?.join(',') || '')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    setErr('')
    if (!title.trim()) return setErr('标题不能为空')
    if (!content.trim()) return setErr('内容不能为空')
    setLoading(true)
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t)
      const { data: { user } } = await supabase.auth.getUser()
      await onSubmit({
        title,
        content,
        category,
        is_starred: init?.is_starred || false,
        tags: tagArray,
        visibility: init?.visibility || 'private',
        like_count: init?.like_count || 0,
        author_id: user?.id || '',
        author_name: user?.user_metadata?.nickname || user?.email || '',
        updated_at: new Date().toISOString()
      })
      setTitle('')
      setContent('')
      setCategory('通用')
      setTags('')
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: 10,
    borderRadius: 8,
    border: `1px solid ${palette.border}`,
    marginBottom: 12,
    background: palette.bgCard
  }

  return (
    <div>
      {err && <p style={{ color: palette.error, margin: '0 0 12px 0' }}>{err}</p>}
      <input
        placeholder="标题"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={inputStyle}
      />
      <textarea
        rows={4}
        placeholder="提示词内容"
        value={content}
        onChange={e => setContent(e.target.value)}
        style={inputStyle}
      />
      <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
        <option value="通用">通用</option>
        <option value="文案">文案</option>
        <option value="编程">编程</option>
        <option value="绘画">绘画</option>
      </select>
      <input
        placeholder="标签（用逗号分隔，如：AI,写作,创意）"
        value={tags}
        onChange={e => setTags(e.target.value)}
        style={inputStyle}
      />
      <button
        disabled={loading}
        onClick={handleSend}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: 'none',
          background: palette.primary,
          color: '#fff',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '提交中...' : init ? '保存修改' : '新增提示词'}
      </button>
    </div>
  )
}