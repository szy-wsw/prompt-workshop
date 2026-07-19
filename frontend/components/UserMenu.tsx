'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '@/app/ThemeProvider'
import { safeFetch } from '@/lib/supabase'
import LoginPopup from './LoginPopup'
import { showToast } from './Toast'

function UserMenu() {
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(true)
  const [avatarError, setAvatarError] = useState(false)
  const router = useRouter()
  const { palette } = useThemeContext()

  useEffect(() => {
    setAvatarLoading(true)
    setAvatarError(false)
  }, [user?.avatar_url])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-user-menu]')) {
        setShowMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setShowMenu(false)
    router.push('/')
    showToast('已退出登录', 'success')
  }

  const handleProfile = () => {
    setShowMenu(false)
    router.push('/profile')
  }

  const handleAvatarEdit = () => {
    setShowMenu(false)
    router.push('/profile#avatar')
  }

  const handlePasswordEdit = () => {
    setShowMenu(false)
    router.push('/profile#password')
  }

  const handleExport = async () => {
    setShowMenu(false)
    if (!user) {
      setShowLoginPopup(true)
      return
    }
    const token = localStorage.getItem('auth_token')
    const result = await safeFetch(`/api/prompts?user_id=${user.id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    if (result.success && result.data) {
      const responseData: any = result.data
      const prompts = Array.isArray(responseData) ? responseData : (responseData.data || [])
      const content = prompts.map((p: any) => `## ${p.title}\n\n${p.content}\n\n---`).join('\n\n')
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompts_${Date.now()}.md`
      a.click()
      URL.revokeObjectURL(url)
      showToast('导出成功', 'success')
    } else {
      showToast(result.error || '导出失败', 'error')
    }
  }

  return (
    <>
      <div data-user-menu style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: palette.primary,
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            fontSize: 18,
            overflow: 'hidden'
          }}
        >
          {user?.avatar_url && !avatarError ? (
            <img
              src={user.avatar_url}
              alt="头像"
              onLoad={() => setAvatarLoading(false)}
              onError={() => { setAvatarLoading(false); setAvatarError(true) }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                opacity: avatarLoading ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
            />
          ) : (
            <span style={{ color: 'white', fontWeight: 600 }}>
              {user ? user.nickname.charAt(0) : '👤'}
            </span>
          )}
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: 50,
              right: 0,
              background: palette.bgCard,
              borderRadius: 16,
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              minWidth: 180,
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease',
              overflow: 'hidden',
              border: `1px solid ${palette.border}`
            }}
          >
            {user ? (
              <>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: palette.text }}>{user.nickname}</div>
                  <div style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>{user.email}</div>
                </div>
                <button
                  onClick={handleProfile}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.text,
                    fontSize: 14,
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = palette.bgHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>👤</span> 个人中心
                </button>
                <button
                  onClick={handleAvatarEdit}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.text,
                    fontSize: 14,
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = palette.bgHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>🖼️</span> 修改头像
                </button>
                <button
                  onClick={handlePasswordEdit}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.text,
                    fontSize: 14,
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = palette.bgHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>🔑</span> 修改密码
                </button>
                <button
                  onClick={handleExport}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.text,
                    fontSize: 14,
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = palette.bgHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>📥</span> 批量导出
                </button>
                <div style={{ borderTop: `1px solid ${palette.border}`, margin: '4px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.error,
                    fontSize: 14,
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = palette.bgHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>🚪</span> 退出登录
                </button>
              </>
            ) : (
              <>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.border}` }}>
                  <div style={{ fontSize: 12, color: palette.textSecondary }}>尚未登录</div>
                </div>
                <button
                  onClick={() => { setShowMenu(false); setShowLoginPopup(true) }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.text,
                    fontSize: 14,
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = palette.bgHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>🔒</span> 登录
                </button>
                <button
                  onClick={() => { setShowMenu(false); router.push('/register') }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.text,
                    fontSize: 14,
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = palette.bgHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span>📝</span> 注册
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </>
  )
}

export default UserMenu