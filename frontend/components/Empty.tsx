'use client'

import { useThemeContext } from '../app/ThemeProvider'

interface EmptyProps {
  icon: string
  title: string
  desc: string
}

export default function Empty({ icon, title, desc }: EmptyProps) {
  const { palette } = useThemeContext()

  return (
    <div
      className="card"
      style={{ textAlign: 'center', padding: '60px 0' }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: palette.text }}>
        {title}
      </h3>
      <p style={{ color: palette.textSecondary }}>{desc}</p>
    </div>
  )
}
