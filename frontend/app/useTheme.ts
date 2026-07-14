import { useState, useEffect } from 'react'
import { themePalettes, ThemeMode, defaultTheme, ThemePalette } from './theme'

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as ThemeMode | null
      return saved || defaultTheme
    }
    return defaultTheme
  })

  useEffect(() => {
    localStorage.setItem('theme', mode)
    applyTheme(themePalettes[mode])
  }, [mode])

  const applyTheme = (palette: ThemePalette) => {
    const root = document.documentElement
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }

  return {
    palette: themePalettes[mode],
    mode,
    setMode,
    themes: themePalettes
  }
}
