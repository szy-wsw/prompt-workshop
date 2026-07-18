'use client'

import { useState, useEffect } from 'react'
import { useThemeContext } from '../ThemeProvider'
import { safeFetch } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { showToast } from '@/components/Toast'
import LoginPopup from '@/components/LoginPopup'
import Skeleton from '@/components/Skeleton'
import Empty from '@/components/Empty'

interface Template {
  id: string
  title: string
  content: string
  tags: string[]
  category: string
  description: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const { user, token } = useAuth()
  const { palette } = useThemeContext()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const result = await safeFetch<Template[]>('/api/templates')
      if (result.success && result.data) {
        setTemplates(result.data)
        const uniqueCategories = [...new Set(result.data.map(t => t.category))]
        setCategories(uniqueCategories)
      }
    } catch (e) {
      console.error('Fetch templates error:', e)
    }
    setLoading(false)
  }

  const handleUseTemplate = async (template: Template) => {
    if (!user || !token) {
      setShowLoginPopup(true)
      return
    }

    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `模板：${template.title}`,
          content: template.content,
          tags: template.tags,
          visibility: 'private',
        })
      })
      const result = await res.json()
      if (result.success) {
        showToast('模板已添加到我的提示词', 'success')
      } else {
        showToast(result.message || '添加失败', 'error')
      }
    } catch (e) {
      showToast('添加失败', 'error')
    }
  }

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: palette.text }}>
          📋 提示词模板库
        </h1>
        <p style={{ color: palette.textSecondary }}>
          使用预设模板快速创建提示词，提高工作效率
        </p>
      </div>

      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={() => setSelectedCategory('')}
            className="tag"
            style={{
              background: selectedCategory === '' ? `${palette.primary}20` : palette.bgCard,
              color: selectedCategory === '' ? palette.primary : palette.textSecondary,
              cursor: 'pointer',
              border: `1px solid ${selectedCategory === '' ? palette.primary : palette.border}`
            }}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="tag"
              style={{
                background: selectedCategory === cat ? `${palette.primary}20` : palette.bgCard,
                color: selectedCategory === cat ? palette.primary : palette.textSecondary,
                cursor: 'pointer',
                border: `1px solid ${selectedCategory === cat ? palette.primary : palette.border}`
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <Skeleton height={22} width="60%" style={{ marginBottom: 8 }} />
              <Skeleton height={14} width="80%" style={{ marginBottom: 12 }} />
              <Skeleton height={14} width="100%" style={{ marginBottom: 8 }} />
              <Skeleton height={14} width="90%" style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Skeleton height={20} width={60} style={{ borderRadius: 10 }} />
                <Skeleton height={20} width={60} style={{ borderRadius: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="card"
              style={{
                padding: 20,
                transition: 'transform 0.2s',
                borderLeft: `4px solid ${palette.primary}`
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: palette.text }}>
                  {template.title}
                </h3>
                <span
                  className="tag tag-primary"
                  style={{ fontSize: 12 }}
                >
                  {template.category}
                </span>
              </div>
              <p style={{ fontSize: 13, color: palette.textSecondary, marginBottom: 12 }}>
                {template.description}
              </p>
              <div
                style={{
                  background: palette.bg,
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  color: palette.text,
                  lineHeight: 1.5,
                  marginBottom: 12,
                  maxHeight: 100,
                  overflowY: 'auto'
                }}
              >
                {template.content.slice(0, 150)}...
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {template.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <button
                className="btn-primary"
                onClick={() => handleUseTemplate(template)}
                style={{ width: '100%', padding: '10px' }}
              >
                ✨ 使用模板
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon="📋" title="暂无模板" desc="即将添加更多实用模板" />
      )}

      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </div>
  )
}