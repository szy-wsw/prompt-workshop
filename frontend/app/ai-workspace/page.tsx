'use client'

import { useThemeContext } from '../ThemeProvider'

export default function AIWorkspacePage() {
  const { palette } = useThemeContext()

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: palette.text }}>
          🤖 AI工作台
        </h1>
        <p style={{ color: palette.textSecondary }}>与AI交互的专属空间</p>
      </div>

      <div
        className="card"
        style={{ textAlign: 'center', padding: '60px 0' }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>🤖</div>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: palette.text }}>
          AI工作台开发中
        </h2>
        <p style={{ color: palette.textSecondary, maxWidth: 400, margin: '0 auto' }}>
          我们正在努力开发AI交互功能，敬请期待！
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <div
            style={{
              background: `${palette.primary}15`,
              padding: '16px 24px',
              borderRadius: 12
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 14, color: palette.textSecondary }}>提示词模板</div>
          </div>
          <div
            style={{
              background: `${palette.primary}15`,
              padding: '16px 24px',
              borderRadius: 12
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 14, color: palette.textSecondary }}>AI对话</div>
          </div>
          <div
            style={{
              background: `${palette.primary}15`,
              padding: '16px 24px',
              borderRadius: 12
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
            <div style={{ fontSize: 14, color: palette.textSecondary }}>快速测试</div>
          </div>
        </div>
      </div>
    </div>
  )
}
