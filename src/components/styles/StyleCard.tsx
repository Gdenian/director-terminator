'use client'

/**
 * 风格卡片组件
 * 展示单个自定义风格的信息和操作按钮
 */
import { AppIcon } from '@/components/ui/icons'
import { toFetchableUrl } from '@/lib/storage'
import type { UserStyle } from '@/hooks/useUserStyles'

interface StyleCardProps {
  style: UserStyle
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * 格式化日期为本地化字符串
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * 解析标签字符串为数组
 */
function parseTags(tags: string | null): string[] {
  if (!tags) return []
  return tags.split(',').map((t) => t.trim()).filter(Boolean)
}

export function StyleCard({ style, onEdit, onDelete }: StyleCardProps) {
  const tags = parseTags(style.tags)
  const displayTags = tags.slice(0, 3)

  return (
    <div className="glass-surface-soft rounded-xl border border-[var(--glass-stroke-base)] p-4 flex flex-col gap-3">
      {/* 顶部：参考图 + 名称 */}
      <div className="flex items-start gap-3">
        {/* 参考图缩略图 */}
        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--glass-bg-muted)] flex items-center justify-center">
          {style.referenceImageUrl ? (
            <img
              src={toFetchableUrl(style.referenceImageUrl)}
              alt={style.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <AppIcon name="image" className="w-6 h-6 text-[var(--glass-text-tertiary)]" />
          )}
        </div>

        {/* 名称和创建时间 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {style.name}
          </h3>
          <p className="text-xs text-[var(--glass-text-tertiary)] mt-1">
            {formatDate(style.createdAt)}
          </p>
        </div>
      </div>

      {/* 标签展示 */}
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayTags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-full bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)]"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--glass-bg-muted)] text-[var(--glass-text-tertiary)]">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* 操作按钮区 */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--glass-stroke-subtle)]">
        <button
          onClick={() => onEdit(style.id)}
          className="glass-btn-base glass-btn-ghost px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5"
        >
          <AppIcon name="edit" className="w-4 h-4" />
          <span className="hidden sm:inline">编辑</span>
        </button>
        <button
          onClick={() => onDelete(style.id)}
          className="glass-btn-base glass-btn-ghost px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 text-[var(--glass-tone-danger-fg)] hover:bg-[var(--glass-tone-danger-bg)]"
        >
          <AppIcon name="trash" className="w-4 h-4" />
          <span className="hidden sm:inline">删除</span>
        </button>
      </div>
    </div>
  )
}
