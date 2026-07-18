'use client'

import { useState, useEffect } from 'react'
import { useThemeContext } from '../ThemeProvider'
import PromptCard from '@/components/PromptCard'
import Skeleton from '@/components/Skeleton'
import Empty from '@/components/Empty'

export default function ForumPage() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const perPage = 12
  const { palette } = useThemeContext()

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPrompts(1)
  }, [search, tagFilter])

  useEffect(() => {
    fetchPrompts(page)
  }, [page])

  const fetchPrompts = async (currentPage: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('visibility', 'public')
      params.set('page', String(currentPage))
      params.set('per_page', String(perPage))
      if (search) params.set('search', search)
      if (tagFilter) params.set('tag', tagFilter)

      const res = await fetch(`/api/prompts?${params.toString()}`)
      const result = await res.json()

      if (result.success && result.data) {
        const promptsList = result.data.data || result.data || []
        setPrompts(promptsList)
        setTotalCount(result.data.total || 0)
      }
    } catch (e) {
      console.error('Fetch prompts error:', e)
    }
    setLoading(false)
  }

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/prompts?visibility=public&per_page=50')
      const result = await res.json()
      if (result.success && result.data) {
        const promptsList = result.data.data || result.data || []
        const allTags = (promptsList as any[]).flatMap((p: any) => p.tags || [])
        const uniqueTags = [...new Set(allTags as string[])].slice(0, 15)
        setTags(uniqueTags as string[])
      }
    } catch (e) {
      console.error('Fetch tags error:', e)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: palette.text }}>
          🌐 公共论坛
        </h1>
        <p style={{ color: palette.textSecondary }}>
          浏览和发现社区分享的优质提示词
        </p>
      </div>

      <div
        style={{
          background: palette.bgCard,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          boxShadow: palette.shadow
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="🔍 搜索提示词..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${palette.border}`,
                fontSize: 14,
                background: palette.bg,
                color: palette.text,
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = palette.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = palette.border}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setTagFilter('')}
              className="tag"
              style={{
                background: tagFilter === '' ? `${palette.primary}20` : palette.bg,
                color: tagFilter === '' ? palette.primary : palette.textSecondary,
                cursor: 'pointer',
                border: `1px solid ${tagFilter === '' ? palette.primary : palette.border}`
              }}
            >
              全部
            </button>
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className="tag"
                style={{
                  background: tagFilter === tag ? `${palette.primary}20` : palette.bg,
                  color: tagFilter === tag ? palette.primary : palette.textSecondary,
                  cursor: 'pointer',
                  border: `1px solid ${tagFilter === tag ? palette.primary : palette.border}`,
                  transition: 'all 0.2s'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Skeleton height={36} width={36} style={{ borderRadius: '50%' }} />
                <Skeleton height={18} width="40%" />
              </div>
              <Skeleton height={22} width="60%" style={{ marginBottom: 12 }} />
              <Skeleton height={14} width="100%" style={{ marginBottom: 8 }} />
              <Skeleton height={14} width="80%" style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Skeleton height={24} width={50} style={{ borderRadius: 12 }} />
                <Skeleton height={24} width={50} style={{ borderRadius: 12 }} />
              </div>
            </div>
          ))}
        </div>
      ) : prompts.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {prompts.map(prompt => (
              <PromptCard key={prompt.id} item={prompt} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
              <button
                className="btn-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: '8px 16px', fontSize: 14 }}
              >
                上一页
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: page === pageNum ? palette.primary : palette.bg,
                        color: page === pageNum ? 'white' : palette.text,
                        border: `1px solid ${page === pageNum ? palette.primary : palette.border}`,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                className="btn-secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ padding: '8px 16px', fontSize: 14 }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        <Empty icon="🔍" title="未找到提示词" desc="尝试更换搜索关键词或标签，或者成为第一个分享的人吧！" />
      )}
    </div>
  )
}
