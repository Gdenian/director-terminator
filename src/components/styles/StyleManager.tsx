'use client'

/**
 * 风格管理组件
 * 管理用户自定义风格列表，支持查看、删除操作
 */
import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { AppIcon } from '@/components/ui/icons'
import { useUserStyles, type UserStyle } from '@/hooks/useUserStyles'
import { useToast } from '@/contexts/ToastContext'
import { apiFetch } from '@/lib/api-fetch'
import { StyleCard } from './StyleCard'
import { ConfigDeleteModal } from '@/components/ui/config-modals/ConfigDeleteModal'
import { MAX_STYLE_LIMIT } from '@/lib/styles/style-service'

/**
 * 登录提示组件
 */
function LoginPrompt() {
  const t = useTranslations('profile')

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <AppIcon name="user" className="w-12 h-12 mb-4 text-[var(--glass-text-tertiary)]" />
      <p className="text-base text-[var(--glass-text-secondary)]">
        请登录后管理您的风格
      </p>
    </div>
  )
}

/**
 * 加载状态组件
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--glass-text-primary)]"></div>
    </div>
  )
}

/**
 * 空状态组件
 */
function EmptyState() {
  const t = useTranslations('profile')

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AppIcon name="sparkles" className="w-12 h-12 mb-4 text-[var(--glass-text-tertiary)]" />
      <p className="text-base font-medium text-[var(--glass-text-primary)] mb-2">
        {t('noStyles')}
      </p>
      <p className="text-sm text-[var(--glass-text-secondary)]">
        {t('noStylesDesc')}
      </p>
    </div>
  )
}

export function StyleManager() {
  const { status } = useSession()
  const { styles, loading, refresh } = useUserStyles()
  const { showToast, showError } = useToast()
  const t = useTranslations('profile')

  const [deleteTarget, setDeleteTarget] = useState<UserStyle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 未登录提示
  if (status !== 'authenticated') {
    return <LoginPrompt />
  }

  // 加载状态
  if (loading) {
    return <LoadingState />
  }

  // 删除处理
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      const res = await apiFetch(`/api/user-styles/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        showError(error.code || 'DELETE_FAILED')
        return
      }

      showToast(t('styleDeleted'), 'success')
      // 刷新列表
      await refresh()
    } catch {
      showError('NETWORK_ERROR')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, refresh, showError, showToast, t])

  // 计算是否达到上限
  const isLimitReached = styles.length >= MAX_STYLE_LIMIT

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
            {t('styles')}
          </h2>
          <p className="text-sm text-[var(--glass-text-secondary)]">
            {t('styleCount', { count: styles.length, limit: MAX_STYLE_LIMIT })}
          </p>
        </div>
        <button
          onClick={() => {
            // 打开创建弹窗，Phase 9 Plan 02 实现
          }}
          disabled={isLimitReached}
          className="glass-btn-base glass-btn-primary px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AppIcon name="plus" className="w-4 h-4" />
          {t('createStyle')}
        </button>
      </div>

      {/* 上限提示 */}
      {isLimitReached && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[var(--glass-tone-warning-bg)] text-[var(--glass-tone-warning-fg)] text-sm">
          {t('styleLimitReached', { limit: MAX_STYLE_LIMIT })}
        </div>
      )}

      {/* 风格列表 */}
      <div className="flex-1 overflow-auto">
        {styles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {styles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                onEdit={() => {
                  // Phase 9 Plan 02 实现
                }}
                onDelete={() =>
                  setDeleteTarget(styles.find((s) => s.id === style.id) || null)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      <ConfigDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={handleDelete}
        title={t('deleteStyleTitle')}
        description={t('deleteStyleDesc', { name: deleteTarget?.name || '' })}
        deleteDisabled={isDeleting}
      />
    </div>
  )
}
