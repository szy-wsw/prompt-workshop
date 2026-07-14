'use client'

import { useThemeContext } from './ThemeProvider'
import { themePalettes, ThemeMode } from './theme'

export default function ThemeToggle() {
  const { mode, setMode } = useThemeContext()

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {(Object.keys(themePalettes) as ThemeMode[]).map(key => (
        <button
          key={key}
          onClick={() => setMode(key)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `2px solid ${mode === key ? themePalettes[key].primaryDark : 'transparent'}`,
            background: themePalettes[key].primary,
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: mode === key ? themePalettes[key].shadow : 'none'
          }}
          title={key.replace('macaron-', '')}
        />
      ))}
    </div>
  )
}
