import { useState, useEffect } from 'react'
import { themePalettes, ThemeMode, defaultTheme, ThemePalette } from './theme'

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return defaultTheme
  const saved = localStorage.getItem('theme') as ThemeMode | null
  if (saved && themePalettes[saved]) {
    return saved
  }
  return defaultTheme
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // 仅在客户端挂载后读取 localStorage，避免 hydration 不匹配
  useEffect(() => {
    const stored = getStoredTheme()
    setMode(stored)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('theme', mode)
    applyTheme(themePalettes[mode])
  }, [mode, mounted])

  const applyTheme = (palette: ThemePalette) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }

  return {
    palette: themePalettes[mode],
    mode,
    setMode,
    themes: themePalettes,
    mounted
  }
}
