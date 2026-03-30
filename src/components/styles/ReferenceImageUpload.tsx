'use client'

/**
 * 参考图上传组件
 * 支持图片文件选择、上传、预览和 AI 提取状态显示
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { AppIcon } from '@/components/ui/icons'
import { apiFetch } from '@/lib/api-fetch'
import { toFetchableUrl } from '@/lib/storage/client'

export type ExtractionStatus = 'pending' | 'completed' | 'failed'

interface ReferenceImageUploadProps {
  styleId: string | null  // 编辑时有值，创建时为 null
  referenceImageUrl: string | null
  extractionStatus: ExtractionStatus
  extractionMessage: string | null
  onUploadSuccess: (data: { referenceImageUrl: string; extractionStatus: string }) => void
  onStatusChange: (status: ExtractionStatus, message?: string) => void
  onFileSelect?: (file: File) => void  // 创建模式：文件选择回调
  selectedFile?: File | null  // 创建模式：已选择的文件
}

export function ReferenceImageUpload({
  styleId,
  referenceImageUrl,
  extractionStatus,
  extractionMessage,
  onUploadSuccess,
  onStatusChange,
  onFileSelect,
  selectedFile,
}: ReferenceImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  // 清理本地预览 URL（防止内存泄漏）
  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  // 获取显示的图片 URL
  const displayUrl = localPreview || (referenceImageUrl ? toFetchableUrl(referenceImageUrl) : null)

  // 处理文件选择
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      onStatusChange('failed', '请选择图片文件')
      return
    }

    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      onStatusChange('failed', '图片大小不能超过 10MB')
      return
    }

    // 创建本地预览
    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)

    // 创建模式：只通知父组件有文件选择
    if (!styleId && onFileSelect) {
      onFileSelect(file)
      return
    }

    // 编辑模式：直接上传
    if (styleId) {
      await uploadFile(file, styleId)
    }
  }, [styleId, onFileSelect, onStatusChange])

  // 上传文件到服务器
  const uploadFile = async (file: File, targetStyleId: string) => {
    setIsUploading(true)
    onStatusChange('pending')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await apiFetch(`/api/user-styles/${targetStyleId}/upload-ref`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        onStatusChange('failed', error.message || '上传失败')
        return
      }

      const data = await res.json()
      onUploadSuccess({
        referenceImageUrl: data.referenceImageUrl,
        extractionStatus: data.extractionStatus || 'pending',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败'
      onStatusChange('failed', message)
    } finally {
      setIsUploading(false)
    }
  }

  // 触发文件选择
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 清理预览 URL
  const handleRemoveImage = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
      setLocalPreview(null)
    }
    onFileSelect?.(null as unknown as File)
  }

  // 状态角标样式
  const getStatusBadgeStyle = () => {
    switch (extractionStatus) {
      case 'pending':
        return 'bg-blue-500/80'
      case 'completed':
        return 'bg-green-500/80'
      case 'failed':
        return 'bg-red-500/80'
      default:
        return 'bg-gray-500/80'
    }
  }

  // 状态文本
  const getStatusText = () => {
    switch (extractionStatus) {
      case 'pending':
        return 'AI 提取中...'
      case 'completed':
        return '提取完成'
      case 'failed':
        return '提取失败'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--glass-text-primary)]">
        参考图
      </label>

      {/* 图片预览区域 */}
      {displayUrl ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[var(--glass-bg-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="参考图预览"
            className="w-full h-full object-cover"
          />

          {/* 状态角标 */}
          {extractionStatus !== 'completed' && (
            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs text-white ${getStatusBadgeStyle()}`}>
              {getStatusText()}
            </div>
          )}

          {/* 提取完成角标 */}
          {extractionStatus === 'completed' && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs text-white bg-green-500/80">
              提取完成
            </div>
          )}

          {/* 提取失败提示 */}
          {extractionStatus === 'failed' && extractionMessage && (
            <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded text-xs text-white bg-red-500/80">
              {extractionMessage}
            </div>
          )}

          {/* 上传中遮罩 */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-video rounded-lg border-2 border-dashed border-[var(--glass-stroke-soft)] flex flex-col items-center justify-center gap-2 text-[var(--glass-text-tertiary)] hover:border-[var(--glass-stroke-base)] transition-colors cursor-pointer"
          onClick={handleUploadClick}
        >
          <AppIcon name="image" className="w-10 h-10" />
          <span className="text-sm">点击上传参考图</span>
          <span className="text-xs">支持 JPG、PNG，最大 10MB</span>
        </div>
      )}

      {/* 操作按钮 */}
      {displayUrl && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="glass-btn-base glass-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <AppIcon name="upload" className="w-4 h-4" />
            更换图片
          </button>
          {extractionStatus === 'failed' && styleId && (selectedFile || referenceImageUrl) && (
            <button
              type="button"
              onClick={() => {
                if (selectedFile) {
                  uploadFile(selectedFile, styleId)
                } else {
                  // 编辑模式下没有本地文件，触发重新上传
                  fileInputRef.current?.click()
                }
              }}
              disabled={isUploading}
              className="glass-btn-base glass-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <AppIcon name="refresh" className="w-4 h-4" />
              重试
            </button>
          )}
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
