'use client'

import { useState, useEffect } from 'react'
import { useThemeContext } from '../app/ThemeProvider'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

let toastId = 0

export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  const event = new CustomEvent('showToast', { detail: { message, type } })
  window.dispatchEvent(event)
}

export default function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])
  const { palette } = useThemeContext()

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; type: 'success' | 'error' | 'warning' | 'info' }
      const newToast: ToastMessage = {
        id: ++toastId,
        message: detail.message,
        type: detail.type
      }
      setMessages(prev => [...prev, newToast])

      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== newToast.id))
      }, 3000)
    }

    window.addEventListener('showToast', handleShowToast)
    return () => window.removeEventListener('showToast', handleShowToast)
  }, [])

  const getStyle = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return { background: '#dcfce7', borderColor: '#86efac', color: '#166534' }
      case 'error':
        return { background: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' }
      case 'warning':
        return { background: '#fef3c7', borderColor: '#fde047', color: '#92400e' }
      default:
        return { background: `${palette.primary}15`, borderColor: palette.primaryLight, color: palette.primaryDark }
    }
  }

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      {messages.map(msg => (
        <div
          key={msg.id}
          style={{
            ...getStyle(msg.type),
            padding: '12px 16px',
            borderRadius: 12,
            borderLeft: `4px solid ${getStyle(msg.type).borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'bounceIn 0.3s ease'
          }}
        >
          <span>{getIcon(msg.type)}</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{msg.message}</span>
        </div>
      ))}
    </div>
  )
}
