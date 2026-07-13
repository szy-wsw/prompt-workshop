'use client'

import { MACARON_THEMES } from '@/lib/theme'
import { useTheme } from '@/hooks/useTheme'

/** 五种马卡龙色系切换器 */
export default function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme()

  return (
    <div className="theme-picker" role="group" aria-label="马卡龙色系切换">
      <span className="theme-picker-label">色系</span>
      <div className="theme-picker-swatches">
        {MACARON_THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`theme-swatch ${theme === item.id ? 'is-active' : ''}`}
            style={{ '--swatch-color': item.swatch } as React.CSSProperties}
            onClick={() => mounted && setTheme(item.id)}
            disabled={!mounted}
            aria-label={`${item.name}主题`}
            aria-pressed={theme === item.id}
            title={item.name}
          >
            <span className="theme-swatch-inner" />
          </button>
        ))}
      </div>
    </div>
  )
}
