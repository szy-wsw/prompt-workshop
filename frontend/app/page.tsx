'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from './ThemeProvider'
import PromptCard from '@/components/PromptCard'
import Skeleton from '@/components/Skeleton'
import Empty from '@/components/Empty'

export default function HomePage() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalPrompts: 0, totalUsers: 0, totalChats: 0, publicPrompts: 0 })
  const [tags, setTags] = useState<string[]>([])
  const { user } = useAuth()
  const { palette } = useThemeContext()

  useEffect(() => {
    fetchPrompts()
    fetchTags()
    fetchStats()
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const res = await fetch('/api/prompts?visibility=public&per_page=6', { headers })
      const result = await res.json()
      
      if (result.success && result.data) {
        setPrompts(result.data.data || result.data || [])
      }
    } catch (e) {
      console.error('Fetch prompts error:', e)
    }
    setLoading(false)
  }

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const res = await fetch('/api/prompts?visibility=public&per_page=50', { headers })
      const result = await res.json()
      
      if (result.success && result.data) {
        const promptsList = result.data.data || result.data || []
        const allTags = (promptsList as any[]).flatMap((p: any) => p.tags || [])
        const uniqueTags = [...new Set(allTags as string[])].slice(0, 10)
        setTags(uniqueTags as string[])
      }
    } catch (e) {
      console.error('Fetch tags error:', e)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/users/stats?type=site')
      const result = await res.json()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (e) {
      console.error('Fetch stats error:', e)
    }
  }

  const quickActions = [
    { icon: '✏️', title: '新建提示词', desc: '创建并管理您的AI提示词', href: '/prompt', color: palette.primary },
    { icon: '🤖', title: 'AI对话', desc: '与AI进行智能对话交流', href: '/ai-workspace', color: palette.success },
    { icon: '🌐', title: '公共论坛', desc: '发现社区优质提示词', href: '/forum', color: '#3b82f6' },
    { icon: '❤️', title: '我的收藏', desc: '查看收藏的优质提示词', href: '/collection', color: '#f43f5e' },
  ]

  const statItems = [
    { label: '公开提示词', value: stats.publicPrompts || 0, icon: '📝', color: palette.primary },
    { label: '注册用户', value: stats.totalUsers || 0, icon: '👥', color: palette.success },
    { label: '对话次数', value: stats.totalChats || 0, icon: '💬', color: '#3b82f6' },
    { label: '总提示词', value: stats.totalPrompts || 0, icon: '📚', color: '#f59e0b' },
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
          <Link href="/ai-workspace">
            <button className="btn-secondary" style={{ padding: '12px 32px', fontSize: 16 }}>
              🤖 开始对话
            </button>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {statItems.map((item, index) => (
          <div
            key={index}
            style={{
              background: palette.bgCard,
              borderRadius: 16,
              padding: 20,
              boxShadow: palette.shadow,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${item.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24
              }}
            >
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: palette.text }}>{item.value}</div>
              <div style={{ fontSize: 13, color: palette.textSecondary }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>⚡ 快速入口</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {quickActions.map((item, index) => (
          <Link key={index} href={item.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: palette.bgCard,
                borderRadius: 16,
                padding: 24,
                cursor: 'pointer',
                boxShadow: palette.shadow,
                transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${item.color}30`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = palette.shadow
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${item.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 16
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: palette.text }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: palette.textSecondary, margin: 0 }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {tags.length > 0 && (
        <>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>🏷️ 热门标签</h2>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
            {tags.map(tag => (
              <Link key={tag} href={`/forum?tag=${encodeURIComponent(tag)}`} style={{ textDecoration: 'none' }}>
                <span
                  className="tag"
                  style={{
                    background: palette.bgCard,
                    color: palette.textSecondary,
                    border: `1px solid ${palette.border}`,
                    cursor: 'pointer',
                    padding: '8px 16px',
                    fontSize: 14,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${palette.primary}15`
                    e.currentTarget.style.color = palette.primary
                    e.currentTarget.style.borderColor = palette.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = palette.bgCard
                    e.currentTarget.style.color = palette.textSecondary
                    e.currentTarget.style.borderColor = palette.border
                  }}
                >
                  #{tag}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>🔥 最新热门</h2>
        <Link href="/forum" style={{ color: palette.primary, fontSize: 14, textDecoration: 'none' }}>
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
            <PromptCard key={prompt._id || prompt.id} item={{ ...prompt, id: prompt._id || prompt.id }} />
          ))}
        </div>
      ) : (
        <Empty icon="📭" title="暂无公开提示词" desc="快来发布第一个提示词吧！" />
      )}
    </div>
  )
}
