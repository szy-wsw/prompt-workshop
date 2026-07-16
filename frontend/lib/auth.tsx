'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_BASE = 'http://127.0.0.1:5000'

export interface User {
  id: string
  email: string
  nickname: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  token: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (email: string, password: string, nickname: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  requireAuth: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 初始化时从localStorage恢复登录状态
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(userData)
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success && data.data) {
        const { user: userData, session } = data.data
        const accessToken = session?.access_token || ''
        setUser(userData)
        setToken(accessToken)
        localStorage.setItem('auth_token', accessToken)
        localStorage.setItem('auth_user', JSON.stringify(userData))
        return { success: true, message: '登录成功' }
      }

      return { success: false, message: data.message || '登录失败' }
    } catch {
      return { success: false, message: '网络连接失败，请检查后端服务' }
    }
  }

  const register = async (email: string, password: string, nickname: string, confirmPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          nickname 
        })
      })

      const data = await response.json()

      if (data.success) {
        return { success: true, message: data.message || '注册成功' }
      }

      return { success: false, message: data.message || '注册失败' }
    } catch {
      return { success: false, message: '网络连接失败，请检查后端服务' }
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      }
    } catch {
      // 忽略错误
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  const requireAuth = (): boolean => {
    return !!user && !!token
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      token,
      login,
      register,
      logout,
      requireAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}