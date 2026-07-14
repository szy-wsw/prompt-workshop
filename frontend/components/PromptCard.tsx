'use client'

import { useState } from 'react'
import { supabase, safeSupabaseQuery } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../app/ThemeProvider'
import LoginPopup from './LoginPopup'
import { showToast } from './Toast'

interface PromptCardProps {
  item: any
  onEdit?: () => void
}

export default function PromptCard({ item, onEdit }: PromptCardProps) {
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [likesCount, setLikesCount] = useState<number>(item.likes_count || 0)
  const { user } = useAuth()
  const { palette } = useThemeContext()

  const handleLike = async () => {
    if (!user) {
      setShowLoginPopup(true)
      return
    }

    if (liked) {
      const result = await safeSupabaseQuery(
        supabase.from('likes').delete().eq('prompt_id', item.id).eq('user_id', user.id)
      )
      if (result.success) {
        setLiked(false)
        setLikesCount(prev => prev - 1)
        showToast('已取消点赞', 'success')
      }
    } else {
      const result = await safeSupabaseQuery(
        supabase.from('likes').insert({ prompt_id: item.id, user_id: user.id })
      )
      if (result.success) {
        setLiked(true)
        setLikesCount(prev => prev + 1)
        showToast('点赞成功', 'success')
      }
    }
  }

  const handleCollect = async () => {
    if (!user) {
      setShowLoginPopup(true)
      return
    }

    if (collected) {
      const result = await safeSupabaseQuery(
        supabase.from('collections').delete().eq('prompt_id', item.id).eq('user_id', user.id)
      )
      if (result.success) {
        setCollected(false)
        showToast('已取消收藏', 'success')
      }
    } else {
      const result = await safeSupabaseQuery(
        supabase.from('collections').insert({ prompt_id: item.id, user_id: user.id })
      )
      if (result.success) {
        setCollected(true)
        showToast('收藏成功', 'success')
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个提示词吗？')) return
    const result = await safeSupabaseQuery(
      supabase.from('prompts').delete().eq('id', item.id)
    )
    if (result.success) {
      showToast('删除成功', 'success')
      window.location.reload()
    }
  }

  const isAuthor = user?.id === item.author_id

  return (
    <>
      <div
        className="card"
        style={{
          position: 'relative',
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
        {isAuthor && onEdit && (
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={onEdit}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `${palette.primary}20`,
                border: 'none',
                color: palette.primary,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `${palette.error}20`,
                border: 'none',
                color: palette.error,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🗑️
            </button>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: palette.text }}>
            {item.title}
          </h3>
          <p
            style={{
              fontSize: 13,
              color: palette.textSecondary,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {item.content}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {(item.tags || []).slice(0, 3).map((tag: string) => (
            <span key={tag} className="tag tag-primary" style={{ background: `${palette.primary}15`, color: palette.primary }}>
              {tag}
            </span>
          ))}
          <span className={`tag ${item.visibility === 'public' ? 'tag-success' : 'tag-warning'}`}>
            {item.visibility === 'public' ? '公开' : '私密'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: palette.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12
              }}
            >
              {item.profiles?.avatar_url ? (
                <img src={item.profiles.avatar_url} alt="头像" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : item.profiles?.nickname ? (
                item.profiles.nickname.charAt(0)
              ) : '👤'}
            </div>
            <span style={{ fontSize: 12, color: palette.textSecondary }}>
              {item.profiles?.nickname || '未知用户'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                color: liked ? palette.error : palette.textSecondary,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{likesCount}</span>
            </button>
            <button
              onClick={handleCollect}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                color: collected ? palette.primary : palette.textSecondary,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
            >
              <span>{collected ? '⭐' : '☆'}</span>
            </button>
          </div>
        </div>
      </div>
      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </>
  )
}
