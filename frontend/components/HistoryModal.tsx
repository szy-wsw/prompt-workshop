'use client'

import { useState, useEffect } from 'react'
import { useThemeContext } from '../app/ThemeProvider'
import { safeFetch } from '@/lib/supabase'
import Skeleton from './Skeleton'
import Empty from './Empty'

interface HistoryModalProps {
  promptId: string
  isOpen: boolean
  onClose: () => void
}

interface HistoryItem {
  id: string
  action: 'create' | 'update' | 'delete'
  title: string
  content: string
  tags: string[]
  visibility: string
  previous_title?: string
  previous_content?: string
  previous_tags?: string[]
  previous_visibility?: string
  created_at: string
}

export default function HistoryModal({ promptId, isOpen, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const { palette } = useThemeContext()

  useEffect(() => {
    if (isOpen && promptId) {
      fetchHistory()
    }
  }, [isOpen, promptId])

  const fetchHistory = async () => {
    setLoading(true)
    const result = await safeFetch<HistoryItem[]>(`/api/prompts/${promptId}/history`)
    if (result.success && result.data) {
      setHistory(result.data)
    }
    setLoading(false)
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return { text: '创建', color: palette.success }
      case 'update': return { text: '修改', color: palette.primary }
      case 'delete': return { text: '删除', color: palette.error }
      default: return { text: action, color: palette.textSecondary }
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        className="card pop-in"
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 32
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>
            📜 版本历史
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: palette.bg,
              border: `1px solid ${palette.border}`,
              fontSize: 16,
              color: palette.textSecondary,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <Skeleton height={20} width="40%" style={{ marginBottom: 8 }} />
                <Skeleton height={16} width="100%" />
              </div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.map((item, index) => {
              const action = getActionLabel(item.action)
              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: 16,
                    borderLeft: `4px solid ${action.color}`,
                    borderRadius: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span
                      className="tag"
                      style={{
                        background: `${action.color}15`,
                        color: action.color
                      }}
                    >
                      {action.text}
                    </span>
                    <span style={{ fontSize: 12, color: palette.textSecondary }}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  {item.action === 'update' && item.previous_content && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: palette.textSecondary, marginBottom: 4 }}>修改前:</div>
                      <div
                        style={{
                          background: palette.bg,
                          padding: 10,
                          borderRadius: 8,
                          fontSize: 13,
                          color: palette.textSecondary,
                          lineHeight: 1.5,
                          maxHeight: 120,
                          overflowY: 'auto'
                        }}
                      >
                        {item.previous_content}
                      </div>
                      <div style={{ fontSize: 12, color: palette.primary, marginTop: 8, marginBottom: 4 }}>修改后:</div>
                    </div>
                  )}

                  <div
                    style={{
                      background: palette.bg,
                      padding: 10,
                      borderRadius: 8,
                      fontSize: 13,
                      color: palette.text,
                      lineHeight: 1.5,
                      maxHeight: 160,
                      overflowY: 'auto'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                    <div>{item.content}</div>
                  </div>

                  {(item.tags || []).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {item.tags.map((tag: string) => (
                        <span key={tag} className="tag tag-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <Empty icon="📜" title="暂无历史记录" desc="该提示词还没有修改记录" />
        )}
      </div>
    </div>
  )
}
