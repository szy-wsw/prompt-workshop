'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../app/ThemeProvider'
import { showToast } from './Toast'

interface LoginPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginPopup({ isOpen, onClose }: LoginPopupProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { palette } = useThemeContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(email, password)
    if (result.success) {
      showToast('登录成功', 'success')
      onClose()
      router.refresh()
    } else {
      showToast(result.message || '登录失败', 'error')
    }

    setLoading(false)
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
        zIndex: 2000,
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '32px',
          animation: 'bounceIn 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>登录账户</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱"
              required
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

          <div style={{ marginBottom: 20 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              required
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

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 16,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: palette.textSecondary }}>还没有账户？</span>
          <Link href="/register" style={{ marginLeft: 4, color: palette.primary, fontWeight: 500 }}>
            立即注册
          </Link>
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
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
    </div>
  )
}
