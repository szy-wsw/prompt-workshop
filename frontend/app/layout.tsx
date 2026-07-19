'use client'

import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import FloatingButton from '@/components/FloatingButton'
import Toast from '@/components/Toast'

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px', minHeight: 'calc(100vh - 80px)' }}>
              {children}
            </main>
            <FloatingButton />
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}