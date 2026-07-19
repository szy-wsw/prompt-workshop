'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useThemeContext } from '@/app/ThemeProvider'
import UserMenu from './UserMenu'

function Navbar() {
  const pathname = usePathname() || '/'
  const { palette } = useThemeContext()
  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/forum', label: '公共论坛', icon: '🌐' },
    { path: '/templates', label: '模板库', icon: '📋' },
    { path: '/prompt', label: '我的提示词', icon: '📝' },
    { path: '/collection', label: '我的收藏', icon: '❤️' },
    { path: '/ai-workspace', label: 'AI工作台', icon: '🤖' }
  ]

  const isActive = (itemPath: string) => {
    return pathname === itemPath
  }

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
              data-active={isActive(item.path)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: isActive(item.path) ? palette.primary : palette.textSecondary,
                background: isActive(item.path) ? `${palette.primary}15` : 'transparent',
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

export default Navbar