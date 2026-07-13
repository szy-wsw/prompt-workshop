'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { ThemeMode, themePalettes } from './theme'

type ThemeContextType = {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  palette: typeof themePalettes[ThemeMode]
}
const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeRaw] = useState<ThemeMode>("macaron-pink")
  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") as ThemeMode
    if (saved && themePalettes[saved]) setModeRaw(saved)
  }, [])
  const setMode = (m: ThemeMode) => {
    setModeRaw(m)
    localStorage.setItem("theme-mode", m)
  }
  const palette = themePalettes[mode]
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--color-primary", palette.primary)
    root.style.setProperty("--color-primary-light", palette.primaryLight)
    root.style.setProperty("--color-bg", palette.bg)
    root.style.setProperty("--color-card", palette.bgCard)
    root.style.setProperty("--color-text", palette.text)
    root.style.setProperty("--color-muted", palette.textMuted)
    root.style.setProperty("--color-border", palette.border)
    root.style.setProperty("--color-danger", palette.danger)
  }, [palette])
  return (
    <ThemeContext.Provider value={{ mode, setMode, palette }}>
      {children}
    </ThemeContext.Provider>
  )
}
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme 必须包裹在ThemeProvider内")
  return ctx
}