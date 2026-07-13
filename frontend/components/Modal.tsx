"use client"
import { useTheme } from "@/app/useTheme"

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}
export default function Modal({ open, title, onClose, children }: Props) {
  const { palette } = useTheme()
  if (!open) return null
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
    }} onClick={onClose}>
      <div style={{
        background: palette.bgCard, width: 480, padding: 24, borderRadius: 16,
        border: `1px solid ${palette.border}`
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: palette.text }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}