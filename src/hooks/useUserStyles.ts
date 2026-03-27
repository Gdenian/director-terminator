'use client'

/**
 * 用户自定义风格获取 Hook
 * 封装用户风格列表获取逻辑，返回选择器兼容的选项格式
 */
import { useState, useEffect, useMemo } from 'react'
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
}

/**
 * 获取当前用户的自定义风格列表
 *
 * 特性：
 * - 未登录时返回空数组，不发起请求
 * - 认证状态为 loading 时不设置 loading=true（避免闪烁）
 * - 仅在 status === 'authenticated' 时发起请求
 * - 错误时静默处理，返回空数组
 */
export function useUserStyles(): UseUserStylesReturn {
  const { status } = useSession()
  const [styles, setStyles] = useState<UserStyle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 未登录时不发起请求
    if (status !== 'authenticated') {
      // 清空之前的数据（用户登出时）
      if (styles.length > 0) {
        setStyles([])
      }
      return
    }

    // 已登录，获取用户风格
    setLoading(true)
    apiFetch('/api/user-styles')
      .then(async (res) => {
        if (!res.ok) {
          // 错误时静默处理
          setStyles([])
          return
        }
        const data = await res.json()
        setStyles(data.styles ?? [])
      })
      .catch(() => {
        // 错误时静默处理
        setStyles([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [status])

  // 转换为选择器选项格式（使用 useMemo 缓存）
  const options = useMemo<StyleOption[]>(() => {
    return styles.map((style) => ({
      value: toUserStyleIdentifier(style.id),
      label: style.name,
    }))
  }, [styles])

  return { styles, options, loading }
}
