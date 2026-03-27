'use client'

/**
 * 标签选择器组件
 * 支持预设标签快速选择和自定义标签输入
 */
import { useState } from 'react'
import { AppIcon } from '@/components/ui/icons'

// 预设标签列表
const PRESET_TAGS = ['写实', '动漫', '抽象', '油画', '水彩', '赛璐璐', '厚涂', '像素']

interface StyleTagSelectorProps {
  value: string[]  // 已选标签
  onChange: (tags: string[]) => void
}

export function StyleTagSelector({ value, onChange }: StyleTagSelectorProps) {
  const [customInput, setCustomInput] = useState('')

  const toggleTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter(t => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  const handleAddCustom = () => {
    const trimmed = customInput.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setCustomInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustom()
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--glass-text-primary)]">
        标签
      </label>

      {/* 预设标签 */}
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all cursor-pointer ${
              value.includes(tag)
                ? 'border-[var(--glass-accent-from)] bg-[var(--glass-accent-from)]/10 text-[var(--glass-accent-from)]'
                : 'border-[var(--glass-stroke-soft)] text-[var(--glass-text-secondary)] hover:border-[var(--glass-stroke-base)]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 已选标签展示 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--glass-bg-muted)] text-xs text-[var(--glass-text-secondary)]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter(t => t !== tag))}
                className="hover:text-[var(--glass-text-primary)]"
              >
                <AppIcon name="close" className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 自定义标签输入 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加自定义标签..."
          className="glass-input-base h-9 px-3 text-sm flex-1"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          disabled={!customInput.trim()}
          className="glass-btn-base glass-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
        >
          添加
        </button>
      </div>
    </div>
  )
}
