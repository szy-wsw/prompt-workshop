'use client'
import { useTheme } from './useTheme'
import { ThemeMode, themeNameMap, themePalettes } from './theme'
const allThemes: ThemeMode[] = ["macaron-pink", "macaron-blue", "macaron-mint", "macaron-yellow", "macaron-lavender"]

export default function ThemeToggle() {
  const { mode, setMode } = useTheme()
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 14 }}>主题切换：</span>
      {allThemes.map(m => (
        <button key={m} onClick={() => setMode(m)} title={themeNameMap[m]} style={{
          width: 28, height: 28, borderRadius: "50%",
          border: mode === m ? "3px #333 solid" : "2px transparent solid",
          backgroundColor: themePalettes[m].primary, cursor: "pointer"
        }} />
      ))}
    </div>
  )
}