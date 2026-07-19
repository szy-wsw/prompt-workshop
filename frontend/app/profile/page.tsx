'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../ThemeProvider'
import LoginPopup from '@/components/LoginPopup'
import { showToast } from '@/components/Toast'
import { themePalettes, ThemeMode } from '../theme'
import { safeFetch } from '@/lib/supabase'

export default function ProfilePage() {
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [nickname, setNickname] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [stats, setStats] = useState({ total_prompts: 0, total_collections: 0, public_prompts: 0 })
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, updateProfile, updatePassword, updateAvatar } = useAuth()
  const { palette, mode, setMode } = useThemeContext()

  useEffect(() => {
    setAvatarLoading(true)
    setAvatarError(false)
  }, [user?.avatar_url])

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '')
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    if (!user) return
    const result = await safeFetch<{ total_prompts: number; total_collections: number; public_prompts: number }>(`/api/users/stats?user_id=${user.id}`)
    if (result.success && result.data) {
      setStats(result.data)
    }
  }

  const handleUpdateNickname = async () => {
    if (!nickname.trim()) {
      showToast('请输入昵称', 'error')
      return
    }
    const result = await updateProfile({ nickname })
    if (result.success) {
      showToast('昵称更新成功', 'success')
    } else {
      showToast(result.message || '更新失败', 'error')
    }
  }

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword) {
      showToast('请填写所有密码字段', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('新密码至少6位', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('两次密码不一致', 'error')
      return
    }
    const result = await updatePassword(oldPassword, newPassword)
    if (result.success) {
      showToast('密码更新成功', 'success')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      showToast(result.message || '更新失败', 'error')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setShowAvatarModal(true)
  }

  const handleAvatarUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return
    const file = fileInputRef.current.files[0]
    setUploading(true)
    const result = await updateAvatar(file)
    if (result.success) {
      showToast('头像更新成功', 'success')
      setShowAvatarModal(false)
      setPreviewUrl(null)
    } else {
      showToast(result.message || '上传失败', 'error')
    }
    setUploading(false)
  }

  const themeOptions: { mode: ThemeMode; label: string; emoji: string }[] = [
    { mode: 'macaron-lavender', label: '薰衣草紫', emoji: '💜' },
    { mode: 'macaron-pink', label: '樱花粉', emoji: '🩷' },
    { mode: 'macaron-blue', label: '天空蓝', emoji: '💙' },
    { mode: 'macaron-mint', label: '薄荷绿', emoji: '💚' },
    { mode: 'macaron-yellow', label: '柠檬黄', emoji: '💛' }
  ]

  if (!user) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card bounce-in" style={{ textAlign: 'center', padding: '60px 40px', maxWidth: 480 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>👤</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: palette.text }}>
            需要登录才能查看个人中心
          </h2>
          <p style={{ color: palette.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
            登录后管理您的头像、昵称、密码，还能查看数据统计和切换主题哦~
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => setShowLoginPopup(true)}>
              立即登录
            </button>
            <button className="btn-secondary" onClick={() => window.location.href = '/register'}>
              注册账户
            </button>
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
          👤 个人中心
        </h1>
        <p style={{ color: palette.textSecondary }}>管理您的账户信息和偏好设置</p>
      </div>

      {/* 数据统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: '我的提示词', value: stats.total_prompts, icon: '📝', color: palette.primary },
          { label: '收藏数量', value: stats.total_collections, icon: '❤️', color: palette.error },
          { label: '公开作品', value: stats.public_prompts, icon: '🌐', color: palette.success }
        ].map(item => (
          <div
            key={item.label}
            className="card"
            style={{
              textAlign: 'center',
              transition: 'transform 0.2s',
              borderTop: `4px solid ${item.color}`
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.value}</div>
            <div style={{ fontSize: 13, color: palette.textSecondary }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* 左侧头像 */}
        <div className="card" style={{ textAlign: 'center', height: 'fit-content' }}>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: palette.primary,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                overflow: 'hidden',
                border: `4px solid ${palette.primaryLight}`,
                boxShadow: palette.shadow
              }}
            >
              {user.avatar_url && !avatarError ? (
                <img
                  src={user.avatar_url}
                  alt="头像"
                  onLoad={() => setAvatarLoading(false)}
                  onError={() => { setAvatarLoading(false); setAvatarError(true) }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: avatarLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease'
                  }}
                />
              ) : (
                <span style={{ color: 'white', fontWeight: 700 }}>{user.nickname.charAt(0)}</span>
              )}
            </div>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: palette.text }}>
            {user.nickname}
          </h3>
          <p style={{ color: palette.textSecondary, marginBottom: 16, fontSize: 13 }}>{user.email}</p>
          <label
            className="btn-secondary"
            style={{ cursor: 'pointer', display: 'inline-block', fontSize: 14 }}
          >
            {uploading ? '上传中...' : '🖼️ 更换头像'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* 右侧表单 */}
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: palette.text }}>
              ✏️ 修改昵称
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入新昵称"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `2px solid ${palette.border}`,
                  fontSize: 14,
                  background: palette.bg,
                  color: palette.text
                }}
              />
              <button className="btn-primary" onClick={handleUpdateNickname}>
                保存
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: palette.text }}>
              🔑 修改密码
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text, fontSize: 13 }}>
                  当前密码
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="请输入当前密码"
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
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text, fontSize: 13 }}>
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码（至少6位）"
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
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text, fontSize: 13 }}>
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: `2px solid ${confirmPassword && confirmPassword !== newPassword ? palette.error : palette.border}`,
                    fontSize: 14,
                    background: palette.bg,
                    color: palette.text
                  }}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <div style={{ fontSize: 12, color: palette.error, marginTop: 4 }}>两次密码不一致</div>
                )}
              </div>
              <button
                className="btn-primary"
                onClick={handleUpdatePassword}
                disabled={!oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
              >
                修改密码
              </button>
            </div>
          </div>

          {/* 主题切换 */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: palette.text }}>
              🎨 主题切换
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {themeOptions.map(option => {
                const p = themePalettes[option.mode]
                const isActive = mode === option.mode
                return (
                  <button
                    key={option.mode}
                    onClick={() => setMode(option.mode)}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: p.bg,
                      border: `2px solid ${isActive ? p.primary : p.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.transform = 'translateY(-4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: p.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18
                    }}>
                      {option.emoji}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: p.text }}>{option.label}</span>
                    {isActive && (
                      <span style={{ fontSize: 12, color: p.primary, fontWeight: 600 }}>✓ 使用中</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 头像预览弹窗 */}
      {showAvatarModal && (
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
          onClick={() => { setShowAvatarModal(false); setPreviewUrl(null) }}
        >
          <div
            className="card pop-in"
            style={{ width: '100%', maxWidth: 400, padding: 32, textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: palette.text }}>
              预览头像
            </h3>
            {previewUrl && (
              <div style={{ marginBottom: 24 }}>
                <img
                  src={previewUrl}
                  alt="预览"
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `4px solid ${palette.primaryLight}`,
                    boxShadow: palette.shadow
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => { setShowAvatarModal(false); setPreviewUrl(null) }}>
                取消
              </button>
              <button className="btn-primary" onClick={handleAvatarUpload} disabled={uploading}>
                {uploading ? '上传中...' : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
