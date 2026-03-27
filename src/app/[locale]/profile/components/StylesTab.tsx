'use client'

/**
 * 风格管理 Tab 组件
 * 在 Profile 页面中展示风格管理功能
 */
import { StyleManager } from '@/components/styles/StyleManager'

export default function StylesTab() {
  return (
    <div className="h-full p-6">
      <StyleManager />
    </div>
  )
}
