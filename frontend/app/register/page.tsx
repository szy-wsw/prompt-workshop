'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../ThemeProvider'
import { showToast } from '@/components/Toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const { palette } = useThemeContext()

  const nicknameError = useMemo(() => {
    if (!nickname) return ''
    return nickname.trim().length >= 2 ? '' : '昵称至少2位'
  }, [nickname])

  const emailError = useMemo(() => {
    if (!email) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) ? '' : '请输入有效的邮箱地址'
  }, [email])

  const passwordError = useMemo(() => {
    if (!password) return ''
    return password.length >= 6 ? '' : '密码至少6位'
  }, [password])

  const confirmError = useMemo(() => {
    if (!confirmPassword) return ''
    return confirmPassword === password ? '' : '两次密码输入不一致'
  }, [confirmPassword, password])

  const isValid = email && password && confirmPassword && nickname &&
    !emailError && !passwordError && !confirmError && !nicknameError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid) {
      if (nicknameError) showToast(nicknameError, 'error')
      else if (emailError) showToast(emailError, 'error')
      else if (passwordError) showToast(passwordError, 'error')
      else if (confirmError) showToast(confirmError, 'error')
      else showToast('请填写所有必填项', 'error')
      return
    }

    setLoading(true)

    const result = await register(email, password, nickname, confirmPassword)
    
    if (result.success) {
      showToast(result.message || '注册成功', 'success')
      router.push('/login')
    } else {
      showToast(result.message || '注册失败', 'error')
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: palette.text }}>创建账户</h1>
          <p style={{ color: palette.textSecondary, marginTop: 8 }}>开始您的提示词之旅</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称（至少2位）"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${nicknameError ? palette.error : palette.border}`,
                fontSize: 14,
                background: palette.bg,
                color: palette.text,
                transition: 'border-color 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onFocus={(e) => { if (!nicknameError) e.currentTarget.style.borderColor = palette.primary }}
              onBlur={(e) => e.currentTarget.style.borderColor = nicknameError ? palette.error : palette.border}
            />
            {nicknameError && (
              <div style={{ fontSize: 12, color: palette.error, marginTop: 4 }}>{nicknameError}</div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
              邮箱
            </label>
            <input
              type="text"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              disabled={loading}
              autoComplete="email"
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
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

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${confirmError ? palette.error : palette.border}`,
                fontSize: 14,
                background: palette.bg,
                color: palette.text,
                transition: 'border-color 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onFocus={(e) => { if (!confirmError) e.currentTarget.style.borderColor = palette.primary }}
              onBlur={(e) => e.currentTarget.style.borderColor = confirmError ? palette.error : palette.border}
            />
            {confirmError && (
              <div style={{ fontSize: 12, color: palette.error, marginTop: 4 }}>{confirmError}</div>
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
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: palette.textSecondary }}>已有账户？</span>
          <Link href="/login" style={{ marginLeft: 4, color: palette.primary, fontWeight: 500 }}>
            立即登录
          </Link>
        </div>
      </div>
    </div>
  )
}