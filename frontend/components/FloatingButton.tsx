'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '@/app/ThemeProvider'
import LoginPopup from './LoginPopup'
import { showToast } from './Toast'

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

export default FloatingButton