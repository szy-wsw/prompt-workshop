'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../ThemeProvider'
import { showToast } from '@/components/Toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { palette } = useThemeContext()

  const emailError = useMemo(() => {
    if (!email) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) ? '' : '请输入有效的邮箱地址'
  }, [email])

  const passwordError = useMemo(() => {
    if (!password) return ''
    return password.length >= 6 ? '' : '密码至少6位'
  }, [password])

  const isValid = email && password && !emailError && !passwordError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      if (emailError) showToast(emailError, 'error')
      else if (passwordError) showToast(passwordError, 'error')
      else showToast('请填写所有必填项', 'error')
      return
    }

    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      showToast(result.message || '登录成功', 'success')
      router.push('/')
    } else {
      showToast(result.message || '登录失败', 'error')
    }

    setLoading(false)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div
        className="card bounce-in"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '40px',
          boxShadow: palette.shadow
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: palette.text }}>欢迎回来</h1>
          <p style={{ color: palette.textSecondary, marginTop: 8 }}>登录您的账户继续探索</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${emailError ? palette.error : palette.border}`,
                fontSize: 14,
                background: palette.bg,
                color: palette.text,
                transition: 'border-color 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onFocus={(e) => { if (!emailError) e.currentTarget.style.borderColor = palette.primary }}
              onBlur={(e) => e.currentTarget.style.borderColor = emailError ? palette.error : palette.border}
            />
            {emailError && (
              <div style={{ fontSize: 12, color: palette.error, marginTop: 4 }}>{emailError}</div>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${passwordError ? palette.error : palette.border}`,
                fontSize: 14,
                background: palette.bg,
                color: palette.text,
                transition: 'border-color 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onFocus={(e) => { if (!passwordError) e.currentTarget.style.borderColor = palette.primary }}
              onBlur={(e) => e.currentTarget.style.borderColor = passwordError ? palette.error : palette.border}
            />
            {passwordError && (
              <div style={{ fontSize: 12, color: palette.error, marginTop: 4 }}>{passwordError}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isValid}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 16,
              opacity: loading || !isValid ? 0.6 : 1,
              cursor: loading || !isValid ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: palette.textSecondary }}>还没有账户？</span>
          <Link href="/register" style={{ marginLeft: 4, color: palette.primary, fontWeight: 500 }}>
            立即注册
          </Link>
        </div>
      </div>
    </div>
  )
}