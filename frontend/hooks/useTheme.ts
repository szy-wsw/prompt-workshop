'use client'

import { useCallback, useEffect, useState } from 'react'
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme'

/** 马卡龙主题切换 Hook */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('sakura')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = getStoredTheme()
    applyTheme(initial)
    setThemeState(initial)
    setMounted(true)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
    setThemeState(next)
  }, [])

  return { theme, setTheme, mounted }
}
