'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, safeSupabaseQuery } from '@/lib/supabase'
import { useThemeContext } from './ThemeProvider'
import PromptCard from '@/components/PromptCard'
import Skeleton from '@/components/Skeleton'
import Empty from '@/components/Empty'

export default function HomePage() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { palette } = useThemeContext()

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    const result = await safeSupabaseQuery(
      supabase.from('prompts').select('*, profiles(nickname, avatar_url)').eq('visibility', 'public').order('created_at', { ascending: false }).limit(6)
    )
    if (result.success && result.data) {
      setPrompts(result.data as any[])
    }
    setLoading(false)
  }

  const features = [
    { icon: '📝', title: '提示词管理', desc: '创建、编辑、管理您的AI提示词' },
    { icon: '🌐', title: '公共论坛', desc: '分享和发现优质提示词' },
    { icon: '❤️', title: '收藏点赞', desc: '收藏喜欢的提示词，支持作者' },
    { icon: '📥', title: '批量导出', desc: '一键导出所有提示词为Markdown' }
  ]

  return (
    <div className="fade-in">
      <div
        style={{
          background: `linear-gradient(135deg, ${palette.primary}20 0%, ${palette.primaryLight}20 100%)`,
          borderRadius: 24,
          padding: '48px',
          marginBottom: 32,
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, color: palette.text }}>
          Prompt仓库
        </h1>
        <p style={{ fontSize: 16, color: palette.textSecondary, maxWidth: 600, margin: '0 auto' }}>
          发现、分享、管理您的AI提示词。让AI更懂您，让创意无限可能。
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/forum">
            <button className="btn-primary" style={{ padding: '12px 32px', fontSize: 16 }}>
              🚀 探索论坛
            </button>
          </Link>
          <Link href="/prompt">
            <button className="btn-secondary" style={{ padding: '12px 32px', fontSize: 16 }}>
              ✏️ 新建提示词
            </button>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {features.map((item, index) => (
          <div
            key={index}
            style={{
              background: palette.bgCard,
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
              boxShadow: palette.shadow,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(167, 139, 250, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = palette.shadow
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: palette.text }}>
              {item.title}
            </h3>
            <p style={{ fontSize: 13, color: palette.textSecondary }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>🔥 最新热门</h2>
        <Link href="/forum" style={{ color: palette.primary, fontSize: 14 }}>
          查看更多 →
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1, 2, 3].map(i => (
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
        <Empty icon="📭" title="暂无公开提示词" desc="快来发布第一个提示词吧！" />
      )}
    </div>
  )
}
