'use client'

/**
 * 用户自定义风格获取 Hook
 * 封装用户风格列表获取逻辑，返回选择器兼容的选项格式
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api-fetch'
import { toUserStyleIdentifier } from '@/lib/styles/style-namespace'

/** 用户风格原始数据（来自 API） */
export interface UserStyle {
  id: string
  name: string
  promptZh: string
  promptEn: string
  tags: string | null
  referenceImageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

/** 选择器选项格式 */
export interface StyleOption {
  value: string  // "user:uuid" 格式
  label: string
}

/** Hook 返回类型 */
export interface UseUserStylesReturn {
  styles: UserStyle[]
  options: StyleOption[]
  loading: boolean
  refresh: () => Promise<void>
}

/**
 * 获取当前用户的自定义风格列表
 *
 * 特性：
 * - 未登录时返回空数组，不发起请求
 * - 认证状态为 loading 时不设置 loading=true（避免闪烁）
 * - 仅在 status === 'authenticated' 时发起请求
 * - 错误时静默处理，返回空数组
 * - 提供 refresh 方法支持手动刷新列表
 */
export function useUserStyles(): UseUserStylesReturn {
  const { status } = useSession()
  const [styles, setStyles] = useState<UserStyle[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * 获取用户风格列表
   */
  const fetchStyles = useCallback(async () => {
    if (status !== 'authenticated') return

    setLoading(true)
    try {
      const res = await apiFetch('/api/user-styles')
      if (res.ok) {
        const data = await res.json()
        setStyles(data.styles ?? [])
      } else {
        // 错误时静默处理
        setStyles([])
      }
    } catch {
      // 错误时静默处理
      setStyles([])
    } finally {
      setLoading(false)
    }
  }, [status])

  /**
   * 刷新风格列表
   */
  const refresh = useCallback(async () => {
    await fetchStyles()
  }, [fetchStyles])

  // 初始加载和认证状态变化时获取数据
  useEffect(() => {
    // 未登录时清空数据
    if (status !== 'authenticated') {
      if (styles.length > 0) {
        setStyles([])
      }
      return
    }

    // 已登录，获取用户风格
    fetchStyles()
  }, [status, fetchStyles])

  // 转换为选择器选项格式（使用 useMemo 缓存）
  const options = useMemo<StyleOption[]>(() => {
    return styles.map((style) => ({
      value: toUserStyleIdentifier(style.id),
      label: style.name,
    }))
  }, [styles])

  return { styles, options, loading, refresh }
}
