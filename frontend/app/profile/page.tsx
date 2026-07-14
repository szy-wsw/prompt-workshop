'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../ThemeProvider'
import LoginPopup from '@/components/LoginPopup'
import { showToast } from '@/components/Toast'

export default function ProfilePage() {
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [nickname, setNickname] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const { user, updateProfile, updatePassword, updateAvatar } = useAuth()
  const { palette } = useThemeContext()

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '')
    }
  }, [user])

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const result = await updateAvatar(file)
    if (result.success) {
      showToast('头像更新成功', 'success')
    } else {
      showToast(result.message || '上传失败', 'error')
    }
    setUploading(false)
  }

  if (!user) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: palette.text }}>
          需要登录才能查看个人中心
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
          👤 个人中心
        </h1>
        <p style={{ color: palette.textSecondary }}>管理您的账户信息</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <div
          className="card"
          style={{ textAlign: 'center' }}
        >
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
                border: `3px solid ${palette.primaryLight}`
              }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.nickname.charAt(0)
              )}
            </div>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: palette.text }}>
            {user.nickname}
          </h3>
          <p style={{ color: palette.textSecondary, marginBottom: 16 }}>{user.email}</p>
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
            {uploading ? '上传中...' : '更换头像'}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: palette.text }}>
              修改昵称
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

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: palette.text }}>
              修改密码
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
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
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
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
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text }}>
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
                    border: `2px solid ${palette.border}`,
                    fontSize: 14,
                    background: palette.bg,
                    color: palette.text
                  }}
                />
              </div>
              <button className="btn-primary" onClick={handleUpdatePassword}>
                修改密码
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
