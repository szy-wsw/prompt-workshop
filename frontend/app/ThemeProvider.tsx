'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useTheme } from './useTheme'
import { ThemeMode, ThemePalette } from './theme'

interface ThemeContextType {
    palette: ThemePalette
    mode: ThemeMode
    setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { palette, mode, setMode } = useTheme()

    return (
        <ThemeContext.Provider value={{ palette, mode, setMode }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useThemeContext() {
    const ctx = useContext(ThemeContext)
    if (!ctx) {
        throw new Error('useThemeContext must be used within a ThemeProvider')
    }
    return ctx
}
