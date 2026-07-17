'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  nickname: string
  avatar_url?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  token: string | null
  register: (email: string, password: string, nickname: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  requireAuth: () => boolean
  updateProfile: (data: { nickname: string }) => Promise<{ success: boolean; message: string }>
  updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>
  updateAvatar: (file: File) => Promise<{ success: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  const register = async (
    email: string,
    password: string,
    nickname: string,
    _confirmPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, email, password })
      })

      const data = await res.json()

      if (data.success) {
        return { success: true, message: data.message || '注册成功' }
      }
      return { success: false, message: data.message || `注册失败(${res.status})` }
    } catch {
      return { success: false, message: '网络连接失败，请检查网络' }
    }
  }

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
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
      return { success: false, message: '网络连接失败，请检查网络' }
    }
  }

  const logout = async () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  const requireAuth = (): boolean => {
    return !!user && !!token
  }

  const updateProfile = async (data: { nickname: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (result.success && user) {
        const updatedUser = { ...user, nickname: data.nickname }
        setUser(updatedUser)
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      }
      return { success: result.success, message: result.message || '更新失败' }
    } catch {
      return { success: false, message: '网络连接失败' }
    }
  }

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: newPassword })
      })
      const result = await res.json()
      return { success: result.success, message: result.message || '更新失败' }
    } catch {
      return { success: false, message: '网络连接失败' }
    }
  }

  const updateAvatar = async (file: File): Promise<{ success: boolean; message: string }> => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })
      const result = await res.json()
      if (result.success && result.data?.avatar_url && user) {
        const updatedUser = { ...user, avatar_url: result.data.avatar_url }
        setUser(updatedUser)
        localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      }
      return { success: result.success, message: result.message || '上传失败' }
    } catch {
      return { success: false, message: '网络连接失败' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      token,
      register,
      login,
      logout,
      requireAuth,
      updateProfile,
      updatePassword,
      updateAvatar
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
