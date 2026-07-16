'use client'

import { useState, useEffect } from 'react'
import { supabase, safeSupabaseQuery } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../ThemeProvider'
import PromptCard from '@/components/PromptCard'
import LoginPopup from '@/components/LoginPopup'
import Skeleton from '@/components/Skeleton'
import Empty from '@/components/Empty'
import Link from 'next/link'

export default function CollectionPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const { user } = useAuth()
  const { palette } = useThemeContext()

  useEffect(() => {
    if (user) {
      fetchCollections()
    }
  }, [user])

  const fetchCollections = async () => {
    setLoading(true)
    const result = await safeSupabaseQuery(
      supabase.from('collections').select('*, prompts(*)').eq('user_id', user!.id).order('created_at', { ascending: false })
    )
    if (result.success && result.data) {
      const data = result.data as any[]
      setCollections(data.map(c => c.prompts).filter(Boolean))
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card bounce-in" style={{ textAlign: 'center', padding: '60px 40px', maxWidth: 480 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>❤️</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: palette.text }}>
            需要登录才能查看收藏
          </h2>
          <p style={{ color: palette.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
            登录后可以在论坛中收藏喜欢的提示词，打造您的专属灵感库~
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => setShowLoginPopup(true)}>
              立即登录
            </button>
            <Link href="/register">
              <button className="btn-secondary">
                注册账户
              </button>
            </Link>
          </div>
          <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: palette.text }}>
          ❤️ 我的收藏
        </h1>
        <p style={{ color: palette.textSecondary }}>查看您收藏的提示词</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" style={{ padding: 20 }}>
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
      ) : collections.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {collections.flat().map(prompt => (
            <PromptCard key={prompt.id} item={prompt} />
          ))}
        </div>
      ) : (
        <Empty icon="❤️" title="暂无收藏" desc="在论坛中点击爱心图标收藏提示词" />
      )}
    </div>
  )
}
