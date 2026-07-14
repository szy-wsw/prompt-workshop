export type ThemeMode = 'macaron-lavender' | 'macaron-pink' | 'macaron-blue' | 'macaron-mint' | 'macaron-yellow'

export interface ThemePalette {
  primary: string
  primaryLight: string
  primaryDark: string
  bg: string
  bgCard: string
  bgHover: string
  text: string
  textSecondary: string
  border: string
  shadow: string
  success: string
  warning: string
  error: string
}

export const themePalettes: Record<ThemeMode, ThemePalette> = {
  'macaron-lavender': {
    primary: '#a78bfa',
    primaryLight: '#c4b5fd',
    primaryDark: '#8b5cf6',
    bg: '#f5f3ff',
    bgCard: '#ffffff',
    bgHover: '#ede9fe',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    shadow: '0 4px 20px rgba(167, 139, 250, 0.15)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  'macaron-pink': {
    primary: '#f472b6',
    primaryLight: '#f9a8d4',
    primaryDark: '#ec4899',
    bg: '#fff1f2',
    bgCard: '#ffffff',
    bgHover: '#ffe4e6',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#fecdd3',
    shadow: '0 4px 20px rgba(244, 114, 182, 0.15)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  'macaron-blue': {
    primary: '#60a5fa',
    primaryLight: '#93c5fd',
    primaryDark: '#3b82f6',
    bg: '#eff6ff',
    bgCard: '#ffffff',
    bgHover: '#dbeafe',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#bfdbfe',
    shadow: '0 4px 20px rgba(96, 165, 250, 0.15)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  'macaron-mint': {
    primary: '#34d399',
    primaryLight: '#6ee7b7',
    primaryDark: '#10b981',
    bg: '#f0fdf4',
    bgCard: '#ffffff',
    bgHover: '#d1fae5',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#bbf7d0',
    shadow: '0 4px 20px rgba(52, 211, 153, 0.15)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  'macaron-yellow': {
    primary: '#fbbf24',
    primaryLight: '#fcd34d',
    primaryDark: '#f59e0b',
    bg: '#fffbeb',
    bgCard: '#ffffff',
    bgHover: '#fef3c7',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#fde68a',
    shadow: '0 4px 20px rgba(251, 191, 36, 0.15)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  }
}

export const defaultTheme: ThemeMode = 'macaron-lavender'
