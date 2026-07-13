export type ThemeMode = 'macaron-pink' | 'macaron-blue' | 'macaron-mint' | 'macaron-yellow' | 'macaron-lavender'

export const themePalettes: Record<ThemeMode, {
  primary: string
  primaryLight: string
  bg: string
  bgCard: string
  text: string
  textMuted: string
  border: string
  danger: string
}> = {
  "macaron-pink": {
    primary: "#F8A8C8", primaryLight: "#FDE6EF", bg: "#FFF7FB", bgCard: "#FFFFFF",
    text: "#333333", textMuted: "#777777", border: "#F4D7E3", danger: "#F28482"
  },
  "macaron-blue": {
    primary: "#9CC4F2", primaryLight: "#E6F0FC", bg: "#F7FBFF", bgCard: "#FFFFFF",
    text: "#333333", textMuted: "#777777", border: "#D7E6F4", danger: "#F28482"
  },
  "macaron-mint": {
    primary: "#99E2C5", primaryLight: "#E6FAF3", bg: "#F7FFFC", bgCard: "#FFFFFF",
    text: "#333333", textMuted: "#777777", border: "#D7F4E8", danger: "#F28482"
  },
  "macaron-yellow": {
    primary: "#F9E795", primaryLight: "#FFFBE6", bg: "#FFFEF7", bgCard: "#FFFFFF",
    text: "#333333", textMuted: "#777777", border: "#F4EDD7", danger: "#F28482"
  },
  "macaron-lavender": {
    primary: "#C9B4F0", primaryLight: "#F0E9FC", bg: "#FBF7FF", bgCard: "#FFFFFF",
    text: "#333333", textMuted: "#777777", border: "#E3D7F4", danger: "#F28482"
  }
}
export const themeNameMap: Record<ThemeMode, string> = {
  "macaron-pink": "马卡龙粉",
  "macaron-blue": "马卡龙浅蓝",
  "macaron-mint": "马卡龙薄荷绿",
  "macaron-yellow": "马卡龙奶黄",
  "macaron-lavender": "马卡龙薰衣草紫"
}