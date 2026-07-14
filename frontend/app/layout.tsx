'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider, useAuth } from '@/lib/auth'
import { supabase, safeSupabaseQuery } from '@/lib/supabase'
import LoginPopup from '@/components/LoginPopup'
import { showToast } from '@/components/Toast'
import { useThemeContext } from './ThemeProvider'

function UserMenu() {
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const router = useRouter()
  const { palette } = useThemeContext()

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
    const result = await safeSupabaseQuery(
      supabase.from('prompts').select('*').eq('author_id', user.id)
    )
    if (result.success && result.data) {
      const prompts = result.data as any[]
      const content = prompts.map(p => `## ${p.title}\n\n${p.content}\n\n---`).join('\n\n')
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
      <div style={{ position: 'relative' }}>
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
            fontSize: 18
          }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="头像" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            user ? user.nickname.charAt(0) : '👤'
          )}
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: 50,
              right: 0,
              background: palette.bgCard,
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              minWidth: 160,
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease'
            }}
          >
            {user ? (
              <>
                <button
                  onClick={handleProfile}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.text,
                    fontSize: 14,
                    transition: 'background 0.2s'
                  }}
                >
                  👤 个人中心
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
                    transition: 'background 0.2s'
                  }}
                >
                  🖼️ 修改头像
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
                    transition: 'background 0.2s'
                  }}
                >
                  🔑 修改密码
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
                    transition: 'background 0.2s'
                  }}
                >
                  📥 批量导出
                </button>
                <hr style={{ border: `1px solid ${palette.border}`, margin: '4px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.error,
                    fontSize: 14,
                    transition: 'background 0.2s'
                  }}
                >
                  🚪 退出登录
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setShowMenu(false); setShowLoginPopup(true) }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    color: palette.text,
                    fontSize: 14,
                    transition: 'background 0.2s'
                  }}
                >
                  🔒 登录
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
                    transition: 'background 0.2s'
                  }}
                >
                  📝 注册
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

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 1000
        }}
        onMouseEnter={() => setShowMenu(true)}
        onMouseLeave={() => setShowMenu(false)}
      >
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <button
              onClick={handleNewPrompt}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: palette.primary,
                color: 'white',
                fontSize: 20,
                boxShadow: '0 4px 12px rgba(167, 139, 250, 0.4)',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="新建提示词"
            >
              ✏️
            </button>
            <button
              onClick={() => { setShowMenu(false); router.push('/prompt'); setTimeout(() => router.push('/prompt'), 0) }}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: palette.bgCard,
                color: palette.text,
                fontSize: 18,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="我的提示词"
            >
              📝
            </button>
            <button
              onClick={scrollToTop}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: palette.bgCard,
                color: palette.text,
                fontSize: 18,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="回到顶部"
            >
              ↑
            </button>
          </div>
        )}

        <button
          onClick={handleNewPrompt}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
            color: 'white',
            fontSize: 24,
            boxShadow: '0 4px 20px rgba(167, 139, 250, 0.4)',
            transition: 'transform 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
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
  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/forum', label: '公共论坛', icon: '🌐' },
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
                borderRadius: 8,
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
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.querySelector('[data-user-menu]')
      if (menu && !menu.contains(e.target as Node)) {
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <html lang="zh-CN">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
              {children}
            </main>
            <FloatingButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
