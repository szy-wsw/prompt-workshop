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

  useEffect(() => {
    const stored = getStoredTheme()
    setMode(stored)
    applyTheme(themePalettes[stored])
  }, [])

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