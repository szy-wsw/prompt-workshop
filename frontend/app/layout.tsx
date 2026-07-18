'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider, useAuth } from '@/lib/auth'
import { safeFetch } from '@/lib/supabase'
import LoginPopup from '@/components/LoginPopup'
import Toast, { showToast } from '@/components/Toast'
import { useThemeContext } from './ThemeProvider'

function UserMenu() {
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const router = useRouter()
  const { palette } = useThemeContext()

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
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="头像" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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

function FloatingButton() {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const router = useRouter()
  const { palette } = useThemeContext()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setShowMenu(false)
  }

  const handleNewPrompt = () => {
    setShowMenu(false)
    if (!user) {
      setShowLoginPopup(true)
      return
    }
    router.push('/prompt')
  }

  const handleAIChat = () => {
    setShowMenu(false)
    if (!user) {
      setShowLoginPopup(true)
      return
    }
    router.push('/ai-workspace')
  }

  const handleExport = async () => {
    setShowMenu(false)
    if (!user) {
      setShowLoginPopup(true)
      return
    }
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch('/api/prompts?user_id=' + user.id, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const result = await res.json()
      if (result.success && result.data) {
        const prompts = result.data.data || result.data || []
        const content = prompts.map((p: any) => `## ${p.title}\n\n${p.content}\n\n---`).join('\n\n')
        const blob = new Blob([content], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prompts_${Date.now()}.md`
        a.click()
        URL.revokeObjectURL(url)
        showToast('批量导出成功', 'success')
      } else {
        showToast(result.message || '导出失败', 'error')
      }
    } catch (e) {
      showToast('导出失败', 'error')
    }
  }

  const handleItemClick = (onClick: () => void, e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  const menuItems = [
    { icon: '✏️', label: '新建提示词', onClick: handleNewPrompt, primary: true },
    { icon: '🤖', label: 'AI对话', onClick: handleAIChat, primary: true },
    { icon: '📥', label: '批量导出', onClick: handleExport },
    { icon: '↑', label: '回到顶部', onClick: scrollToTop },
  ]

  return (
    <>
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 1000
        }}
      >
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: 75,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: 'fadeInUp 0.2s ease'
            }}
          >
            {menuItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                <span style={{
                  background: palette.bgCard,
                  color: palette.text,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  boxShadow: palette.shadow,
                  border: `1px solid ${palette.border}`,
                  whiteSpace: 'nowrap'
                }}>
                  {item.label}
                </span>
                <button
                  onClick={(e) => handleItemClick(item.onClick, e)}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: item.primary ? palette.primary : palette.bgCard,
                    color: item.primary ? 'white' : palette.text,
                    fontSize: 20,
                    boxShadow: item.primary
                      ? '0 4px 12px rgba(167, 139, 250, 0.4)'
                      : '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: item.primary ? 'none' : `1px solid ${palette.border}`
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {item.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={toggleMenu}
          title={showMenu ? '收起菜单' : '展开快捷功能'}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
            color: 'white',
            fontSize: 28,
            boxShadow: '0 6px 24px rgba(167, 139, 250, 0.4)',
            transition: 'transform 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transform: showMenu ? 'rotate(45deg)' : 'rotate(0deg)',
            border: 'none'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = showMenu ? 'rotate(45deg) scale(1.1)' : 'scale(1.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = showMenu ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </button>
      </div>
      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </>
  )
}

function Navbar() {
  const pathname = usePathname()
  const { palette } = useThemeContext()
  const { user } = useAuth()
  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/forum', label: '公共论坛', icon: '🌐' },
    { path: '/templates', label: '模板库', icon: '📋' },
    { path: '/prompt', label: '我的提示词', icon: '📝' },
    { path: '/collection', label: '我的收藏', icon: '❤️' },
    { path: '/ai-workspace', label: 'AI工作台', icon: '🤖' }
  ]

  return (
    <nav
      style={{
        background: palette.bgCard,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 900,
        padding: '12px 24px'
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 28 }}>🐾</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: palette.text }}>Prompt仓库</span>
        </Link>

        <div style={{ display: 'flex', gap: 4 }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: pathname === item.path ? palette.primary : palette.textSecondary,
                background: pathname === item.path ? `${palette.primary}15` : 'transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>

        <UserMenu />
      </div>
    </nav>
  )
}

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px', minHeight: 'calc(100vh - 80px)' }}>
              {children}
            </main>
            <FloatingButton />
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
