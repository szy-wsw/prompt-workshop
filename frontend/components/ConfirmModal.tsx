'use client'

import { useThemeContext } from '../app/ThemeProvider'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  const { palette } = useThemeContext()

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onCancel}
    >
      <div
        className="card pop-in"
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 32,
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>🥺</div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: palette.text }}>
          {title}
        </h3>
        <p style={{ color: palette.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            style={{ background: palette.error }}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
}
