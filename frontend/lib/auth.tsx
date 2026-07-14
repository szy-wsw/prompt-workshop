'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, safeSupabaseQuery } from './supabase'

export interface User {
  id: string
  email: string
  nickname: string
  avatar_url: string | null
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (email: string, password: string, nickname: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  updateProfile: (data: { nickname?: string }) => Promise<{ success: boolean; message: string }>
  updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>
  updateAvatar: (file: File) => Promise<{ success: boolean; message: string }>
  requireAuth: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        if (error || !authUser) {
          setUser(null)
          setLoading(false)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, nickname, avatar_url')
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            nickname: authUser.user_metadata?.nickname || '用户',
            avatar_url: null
          })
        } else {
          setUser({
            id: profile.id,
            email: profile.email,
            nickname: profile.nickname || authUser.user_metadata?.nickname || '用户',
            avatar_url: profile.avatar_url || null
          })
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: '邮箱或密码错误' }
        }
        return { success: false, message: '登录失败：' + error.message }
      }
      return { success: true, message: '登录成功' }
    } catch (e: any) {
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  const register = async (email: string, password: string, nickname: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname }
        }
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          return { success: false, message: '该邮箱已注册' }
        }
        return { success: false, message: '注册失败：' + error.message }
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          nickname,
          avatar_url: null,
          created_at: new Date().toISOString()
        })
      }

      return { success: true, message: '注册成功，请登录' }
    } catch (e: any) {
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch {
      setUser(null)
    }
  }

  const updateProfile = async (data: { nickname?: string }): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '请先登录' }
    try {
      const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
      if (error) {
        return { success: false, message: '修改失败' }
      }
      if (data.nickname) {
        setUser(prev => prev ? { ...prev, nickname: data.nickname as string } : null)
      }
      return { success: true, message: '更新成功' }
    } catch {
      return { success: false, message: '网络错误' }
    }
  }

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '请先登录' }
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword
      })
      if (signInError) {
        return { success: false, message: '当前密码错误' }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        return { success: false, message: '密码修改失败' }
      }
      return { success: true, message: '密码修改成功' }
    } catch {
      return { success: false, message: '网络错误' }
    }
  }

  const updateAvatar = async (file: File): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '请先登录' }
    try {
      const fileName = `${user.id}-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) {
        return { success: false, message: '头像上传失败' }
      }

      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        return { success: false, message: '获取头像地址失败' }
      }

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id)
      if (updateError) {
        return { success: false, message: '头像更新失败' }
      }

      setUser(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : null)
      return { success: true, message: '头像修改成功' }
    } catch {
      return { success: false, message: '网络错误' }
    }
  }

  const requireAuth = (): boolean => {
    return !!user
  }

  const providerValue = { user, loading, login, register, logout, updateProfile, updatePassword, updateAvatar, requireAuth }

  return <AuthContext.Provider value={providerValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
