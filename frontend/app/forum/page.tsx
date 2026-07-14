'use client'

import { useState, useEffect } from 'react'
import { supabase, safeSupabaseQuery } from '@/lib/supabase'
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
  const { palette } = useThemeContext()

  useEffect(() => {
    fetchPrompts()
    fetchTags()
  }, [search, tagFilter])

  const fetchPrompts = async () => {
    setLoading(true)
    let query = supabase.from('prompts').select('*, profiles(nickname, avatar_url)').eq('visibility', 'public').order('likes_count', { ascending: false })
    
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
    if (tagFilter) {
      query = query.contains('tags', [tagFilter])
    }
    
    const result = await safeSupabaseQuery(query)
    if (result.success && result.data) {
      setPrompts(result.data as any[])
    }
    setLoading(false)
  }

  const fetchTags = async () => {
    const result = await safeSupabaseQuery(
      supabase.from('prompts').select('tags').eq('visibility', 'public')
    )
    if (result.success && result.data) {
      const allTags = (result.data as any[]).flatMap(p => p.tags || [])
      const uniqueTags = [...new Set(allTags)].slice(0, 10)
      setTags(uniqueTags)
    }
  }

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
              placeholder="搜索提示词..."
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
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                className={`tag ${tagFilter === tag ? 'tag-primary' : 'tag-success'}`}
                style={{
                  background: tagFilter === tag ? `${palette.primary}20` : '#f0fdf4',
                  color: tagFilter === tag ? palette.primary : '#10b981',
                  cursor: 'pointer',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card">
              <Skeleton height={24} width="60%" style={{ marginBottom: 12 }} />
              <Skeleton height={16} width="100%" style={{ marginBottom: 8 }} />
              <Skeleton height={16} width="80%" style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Skeleton height={28} width={60} />
                <Skeleton height={28} width={60} />
              </div>
            </div>
          ))}
        </div>
      ) : prompts.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {prompts.map(prompt => (
            <PromptCard key={prompt.id} item={prompt} />
          ))}
        </div>
      ) : (
        <Empty icon="🔍" title="未找到提示词" desc="尝试更换搜索关键词或标签" />
      )}
    </div>
  )
}
