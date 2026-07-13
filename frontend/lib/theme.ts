/** 五种马卡龙主题定义 */
export const MACARON_THEMES = [
  { id: 'sakura', name: '樱花粉', swatch: '#f8b4cc' },
  { id: 'mint', name: '薄荷绿', swatch: '#86efcb' },
  { id: 'lavender', name: '薰衣草', swatch: '#c4b5fd' },
  { id: 'sky', name: '天空蓝', swatch: '#7dd3fc' },
  { id: 'peach', name: '蜜桃橙', swatch: '#fdba74' },
] as const

export type Theme = (typeof MACARON_THEMES)[number]['id']

export const THEME_STORAGE_KEY = 'prompt-theme'
export const DEFAULT_THEME: Theme = 'sakura'

const VALID_THEMES = new Set<string>(MACARON_THEMES.map((t) => t.id))

/** 读取本地存储的主题，无效则返回默认 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored && VALID_THEMES.has(stored)) return stored as Theme
  return DEFAULT_THEME
}

/** 将主题应用到 html 根节点并持久化 */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

/** 供首屏 inline script 使用的主题 ID 列表 */
export const THEME_IDS = MACARON_THEMES.map((t) => t.id)
