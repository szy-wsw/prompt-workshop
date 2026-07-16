'use client'

import { useState, useEffect } from 'react'
import { supabase, safeSupabaseQuery } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../ThemeProvider'
import PromptCard from '@/components/PromptCard'
import LoginPopup from '@/components/LoginPopup'
import Skeleton from '@/components/Skeleton'
import Empty from '@/components/Empty'
import { showToast } from '@/components/Toast'
import Link from 'next/link'

export default function PromptPage() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    visibility: 'private' as 'private' | 'public'
  })
  const { user } = useAuth()
  const { palette } = useThemeContext()

  useEffect(() => {
    if (user) {
      fetchPrompts()
    }
  }, [user])

  const fetchPrompts = async () => {
    setLoading(true)
    const result = await safeSupabaseQuery(
      supabase.from('prompts').select('*').eq('author_id', user!.id).order('created_at', { ascending: false })
    )
    if (result.success && result.data) {
      setPrompts(result.data as any[])
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingPrompt(null)
    setFormData({
      title: '',
      content: '',
      tags: '',
      visibility: 'private'
    })
    setShowEditModal(true)
  }

  const handleEdit = (prompt: any) => {
    setEditingPrompt(prompt)
    setFormData({
      title: prompt.title,
      content: prompt.content,
      tags: (prompt.tags || []).join(','),
      visibility: prompt.visibility
    })
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('请填写标题和内容', 'error')
      return
    }

    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t)

    if (editingPrompt) {
      const result = await safeSupabaseQuery(
        supabase.from('prompts').update({
          title: formData.title,
          content: formData.content,
          tags,
          visibility: formData.visibility,
          updated_at: new Date().toISOString()
        }).eq('id', editingPrompt.id)
      )
      if (result.success) {
        showToast('更新成功', 'success')
        fetchPrompts()
      } else {
        showToast(result.error || '更新失败', 'error')
      }
    } else {
      const result = await safeSupabaseQuery(
        supabase.from('prompts').insert({
          title: formData.title,
          content: formData.content,
          tags,
          visibility: formData.visibility,
          author_id: user!.id,
          likes_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      )
      if (result.success) {
        showToast('创建成功', 'success')
        fetchPrompts()
      } else {
        showToast(result.error || '创建失败', 'error')
      }
    }
    setShowEditModal(false)
  }

  if (!user) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card bounce-in" style={{ textAlign: 'center', padding: '60px 40px', maxWidth: 480 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: palette.text }}>
            需要登录才能管理提示词
          </h2>
          <p style={{ color: palette.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
            登录后可以创建、编辑和管理您的专属提示词库，还支持一键分享至公共论坛哦~
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
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: palette.text }}>
            📝 我的提示词
          </h1>
          <p style={{ color: palette.textSecondary }}>管理和编辑您的提示词</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          + 新建提示词
        </button>
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
      ) : prompts.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {prompts.map(prompt => (
            <PromptCard key={prompt.id} item={prompt} onEdit={() => handleEdit(prompt)} onDelete={fetchPrompts} />
          ))}
        </div>
      ) : (
        <Empty icon="📝" title="暂无提示词" desc="点击右上角按钮创建您的第一个提示词" />
      )}

      {showEditModal && (
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
            zIndex: 2000,
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 600,
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: 32,
              animation: 'bounceIn 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: palette.text }}>
              {editingPrompt ? '编辑提示词' : '新建提示词'}
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
                标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入提示词标题"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `2px solid ${palette.border}`,
                  fontSize: 14,
                  background: palette.bg,
                  color: palette.text
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
                标签（用逗号分隔）
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="如：写作, AI, 创意"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `2px solid ${palette.border}`,
                  fontSize: 14,
                  background: palette.bg,
                  color: palette.text
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
                可见性
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'private' | 'public' })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `2px solid ${palette.border}`,
                  fontSize: 14,
                  background: palette.bg,
                  color: palette.text,
                  cursor: 'pointer'
                }}
              >
                <option value="private">🔒 私密（仅自己可见）</option>
                <option value="public">🌐 公开（所有人可见）</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
                内容
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入提示词内容..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `2px solid ${palette.border}`,
                  fontSize: 14,
                  background: palette.bg,
                  color: palette.text,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingPrompt ? '保存修改' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
