'use client'

import { useState, useEffect } from 'react'
import { supabase, safeSupabaseQuery, safeFetch } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../app/ThemeProvider'
import LoginPopup from './LoginPopup'
import ConfirmModal from './ConfirmModal'
import HistoryModal from './HistoryModal'
import { showToast } from './Toast'

interface PromptCardProps {
  item: any
  onEdit?: () => void
  onDelete?: () => void
}

export default function PromptCard({ item, onEdit, onDelete }: PromptCardProps) {
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [likesCount, setLikesCount] = useState<number>(item.likes_count || 0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { user } = useAuth()
  const { palette } = useThemeContext()

  useEffect(() => {
    if (user && item.id) {
      checkLikeStatus()
      checkCollectStatus()
    }
  }, [user, item.id])

  const checkLikeStatus = async () => {
    const result = await safeFetch(`/api/likes/check?prompt_id=${item.id}&user_id=${user!.id}`)
    if (result.success && result.data) {
      setLiked((result.data as any).liked)
    }
  }

  const checkCollectStatus = async () => {
    const result = await safeFetch(`/api/collections/check?prompt_id=${item.id}&user_id=${user!.id}`)
    if (result.success && result.data) {
      setCollected((result.data as any).collected)
    }
  }

  const handleLike = async () => {
    if (!user) {
      setShowLoginPopup(true)
      return
    }

    if (liked) {
      const result = await safeFetch('/api/likes', {
        method: 'DELETE',
        body: JSON.stringify({ prompt_id: item.id, user_id: user.id })
      })
      if (result.success) {
        setLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
        showToast('已取消点赞', 'success')
      } else {
        showToast(result.error || '操作失败', 'error')
      }
    } else {
      const result = await safeFetch('/api/likes', {
        method: 'POST',
        body: JSON.stringify({ prompt_id: item.id, user_id: user.id })
      })
      if (result.success) {
        setLiked(true)
        setLikesCount(prev => prev + 1)
        showToast('点赞成功', 'success')
      } else {
        if (result.error?.includes('已点赞')) {
          showToast('您已经点赞过啦', 'warning')
          setLiked(true)
        } else {
          showToast(result.error || '操作失败', 'error')
        }
      }
    }
  }

  const handleCollect = async () => {
    if (!user) {
      setShowLoginPopup(true)
      return
    }

    if (collected) {
      const result = await safeFetch('/api/collections', {
        method: 'DELETE',
        body: JSON.stringify({ prompt_id: item.id, user_id: user.id })
      })
      if (result.success) {
        setCollected(false)
        showToast('已取消收藏', 'success')
      } else {
        showToast(result.error || '操作失败', 'error')
      }
    } else {
      const result = await safeFetch('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ prompt_id: item.id, user_id: user.id })
      })
      if (result.success) {
        setCollected(true)
        showToast('收藏成功', 'success')
      } else {
        if (result.error?.includes('已收藏')) {
          showToast('您已经收藏过啦', 'warning')
          setCollected(true)
        } else {
          showToast(result.error || '操作失败', 'error')
        }
      }
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content)
      showToast('内容已复制到剪贴板', 'success')
    } catch {
      showToast('复制失败，请手动复制', 'error')
    }
  }

  const handleDelete = async () => {
    setShowConfirm(false)
    const result = await safeSupabaseQuery(
      supabase.from('prompts').delete().eq('id', item.id)
    )
    if (result.success) {
      showToast('删除成功', 'success')
      if (onDelete) {
        onDelete()
      } else {
        window.location.reload()
      }
    } else {
      showToast(result.error || '删除失败', 'error')
    }
  }

  const isAuthor = user?.id === item.author_id

  return (
    <>
      <div
        className="card"
        style={{
          position: 'relative',
          transition: 'transform 0.25s, box-shadow 0.25s',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(167, 139, 250, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = palette.shadow
        }}
      >
        {/* 顶部操作栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
            {(item.tags || []).slice(0, 3).map((tag: string) => (
              <span key={tag} className="tag tag-primary" style={{ background: `${palette.primary}15`, color: palette.primary }}>
                {tag}
              </span>
            ))}
            <span className={`tag ${item.visibility === 'public' ? 'tag-success' : 'tag-warning'}`}>
              {item.visibility === 'public' ? '公开' : '私密'}
            </span>
          </div>
          {isAuthor && onEdit && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              <button
                onClick={onEdit}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: `${palette.primary}15`,
                  border: 'none',
                  color: palette.primary,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s'
                }}
                title="编辑"
              >
                ✏️
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: `${palette.error}15`,
                  border: 'none',
                  color: palette.error,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s'
                }}
                title="删除"
              >
                🗑️
              </button>
              <button
                onClick={() => setShowHistory(true)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: `${palette.success}15`,
                  border: 'none',
                  color: palette.success,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s'
                }}
                title="版本历史"
              >
                📜
              </button>
            </div>
          )}
          {isAuthor && !onEdit && (
            <button
              onClick={() => setShowHistory(true)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `${palette.success}15`,
                border: 'none',
                color: palette.success,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="版本历史"
            >
              📜
            </button>
          )}
        </div>

        {/* 内容区 */}
        <div style={{ flex: 1, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: palette.text, lineHeight: 1.4 }}>
            {item.title}
          </h3>
          <p
            style={{
              fontSize: 13,
              color: palette.textSecondary,
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap'
            }}
          >
            {item.content}
          </p>
        </div>

        {/* 底部信息 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${palette.border}` }}>
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
                fontSize: 12,
                overflow: 'hidden'
              }}
            >
              {item.profiles?.avatar_url ? (
                <img src={item.profiles.avatar_url} alt="头像" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : item.profiles?.nickname ? (
                <span style={{ color: 'white', fontWeight: 600 }}>{item.profiles.nickname.charAt(0)}</span>
              ) : (
                <span style={{ color: 'white' }}>👤</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: palette.textSecondary }}>
              {item.profiles?.nickname || '未知用户'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
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
                transition: 'color 0.2s, transform 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              title="点赞"
            >
              <span style={{ fontSize: 16 }}>{liked ? '❤️' : '🤍'}</span>
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
                transition: 'color 0.2s, transform 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              title="收藏"
            >
              <span style={{ fontSize: 16 }}>{collected ? '⭐' : '☆'}</span>
            </button>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                color: palette.textSecondary,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'color 0.2s, transform 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = palette.primary; e.currentTarget.style.transform = 'scale(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = palette.textSecondary; e.currentTarget.style.transform = 'scale(1)' }}
              title="复制内容"
            >
              <span style={{ fontSize: 16 }}>📋</span>
            </button>
          </div>
        </div>
      </div>

      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
      <ConfirmModal
        isOpen={showConfirm}
        title="确定要删除吗？"
        message={`提示词「${item.title}」删除后将无法恢复，相关历史记录也会被清除哦~`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
      <HistoryModal
        promptId={item.id}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  )
}
