'use client'

import { useState, useEffect } from 'react'
import { supabase, safeSupabaseQuery } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../ThemeProvider'
import PromptCard from '@/components/PromptCard'
import LoginPopup from '@/components/LoginPopup'
import Skeleton from '@/components/Skeleton'
import Empty from '@/components/Empty'

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
      <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>❤️</div>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: palette.text }}>
          需要登录才能查看收藏
        </h2>
        <button
          className="btn-primary"
          onClick={() => setShowLoginPopup(true)}
        >
          立即登录
        </button>
        <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
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
      ) : collections.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
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
