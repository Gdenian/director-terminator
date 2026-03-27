'use client'

/**
 * 风格创建/编辑弹窗组件
 * 支持创建新风格和编辑已有风格
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import GlassModalShell from '@/components/ui/primitives/GlassModalShell'
import { AppIcon } from '@/components/ui/icons'
import { apiFetch } from '@/lib/api-fetch'
import { useToast } from '@/contexts/ToastContext'
import { StyleTagSelector } from './StyleTagSelector'
import { ReferenceImageUpload, type ExtractionStatus } from './ReferenceImageUpload'
import type { UserStyle } from '@/hooks/useUserStyles'

interface StyleCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void  // 创建/编辑成功后回调
  editStyle?: UserStyle | null  // 编辑模式时传入
}

interface FormData {
  name: string
  promptZh: string
  promptEn: string
  tags: string[]
}

const INITIAL_FORM_DATA: FormData = {
  name: '',
  promptZh: '',
  promptEn: '',
  tags: [],
}

export function StyleCreateModal({
  isOpen,
  onClose,
  onSuccess,
  editStyle,
}: StyleCreateModalProps) {
  const t = useTranslations('profile')
  const { showToast, showError } = useToast()

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null)
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('pending')
  const [extractionMessage, setExtractionMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdStyleId, setCreatedStyleId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // 轮询相关
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // 是否为编辑模式
  const isEditMode = !!editStyle

  // 初始化表单数据（编辑模式）
  useEffect(() => {
    if (editStyle) {
      setFormData({
        name: editStyle.name,
        promptZh: editStyle.promptZh,
        promptEn: editStyle.promptEn,
        tags: editStyle.tags ? editStyle.tags.split(',').filter(Boolean) : [],
      })
      setReferenceImageUrl(editStyle.referenceImageUrl)
      // 编辑模式：如果有参考图，默认状态为 completed
      setExtractionStatus(editStyle.referenceImageUrl ? 'completed' : 'pending')
      setCreatedStyleId(editStyle.id)
    } else {
      // 创建模式：重置表单
      setFormData(INITIAL_FORM_DATA)
      setReferenceImageUrl(null)
      setExtractionStatus('pending')
      setExtractionMessage(null)
      setCreatedStyleId(null)
      setSelectedFile(null)
    }
  }, [editStyle, isOpen])

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // 轮询提取状态
  const startPolling = useCallback((styleId: string) => {
    // 清理之前的轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/user-styles/${styleId}`)
        if (!res.ok) {
          console.error('轮询风格状态失败')
          return
        }

        const data = await res.json()
        const style = data.style

        if (style?.extractionStatus === 'completed') {
          setExtractionStatus('completed')
          // 如果提示词为空，自动填充
          if (!formData.promptZh && style.draftPromptZh) {
            setFormData(prev => ({ ...prev, promptZh: style.draftPromptZh }))
          }
          if (!formData.promptEn && style.draftPromptEn) {
            setFormData(prev => ({ ...prev, promptEn: style.draftPromptEn }))
          }
          // 停止轮询
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        } else if (style?.extractionStatus === 'failed') {
          setExtractionStatus('failed')
          setExtractionMessage(style.extractionMessage || '提取失败')
          // 停止轮询
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      } catch (error) {
        console.error('轮询出错:', error)
      }
    }, 3000)
  }, [formData.promptZh, formData.promptEn])

  // 表单字段更新
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 验证表单
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showError('VALIDATION_ERROR', { message: '请输入风格名称' })
      return false
    }
    if (formData.name.length > 50) {
      showError('VALIDATION_ERROR', { message: '风格名称不能超过 50 个字符' })
      return false
    }
    if (!formData.promptZh.trim()) {
      showError('VALIDATION_ERROR', { message: '请输入中文提示词' })
      return false
    }
    if (formData.promptZh.length > 2000) {
      showError('VALIDATION_ERROR', { message: '中文提示词不能超过 2000 个字符' })
      return false
    }
    if (!formData.promptEn.trim()) {
      showError('VALIDATION_ERROR', { message: '请输入英文提示词' })
      return false
    }
    if (formData.promptEn.length > 2000) {
      showError('VALIDATION_ERROR', { message: '英文提示词不能超过 2000 个字符' })
      return false
    }
    return true
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (isEditMode && editStyle) {
        // 编辑模式：PUT 更新
        const res = await apiFetch(`/api/user-styles/${editStyle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            promptZh: formData.promptZh,
            promptEn: formData.promptEn,
            tags: formData.tags,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          showError(error.code || 'UPDATE_FAILED', error)
          return
        }

        showToast(t('styleUpdated'), 'success')
        onSuccess()
      } else {
        // 创建模式：POST 创建
        const res = await apiFetch('/api/user-styles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            promptZh: formData.promptZh,
            promptEn: formData.promptEn,
            tags: formData.tags,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          showError(error.code || 'CREATE_FAILED', error)
          return
        }

        const data = await res.json()
        const newStyleId = data.style?.id

        showToast(t('styleCreated'), 'success')

        // 如果有选择的文件，上传参考图
        if (newStyleId && selectedFile) {
          setCreatedStyleId(newStyleId)
          // 上传参考图
          const formDataObj = new FormData()
          formDataObj.append('file', selectedFile)

          const uploadRes = await apiFetch(`/api/user-styles/${newStyleId}/upload-ref`, {
            method: 'POST',
            body: formDataObj,
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            setReferenceImageUrl(uploadData.referenceImageUrl)
            setExtractionStatus(uploadData.extractionStatus || 'pending')
            // 开始轮询提取状态
            if (uploadData.extractionStatus === 'pending') {
              startPolling(newStyleId)
            }
          }
        } else {
          onSuccess()
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败'
      showError('NETWORK_ERROR', { message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理参考图上传成功
  const handleUploadSuccess = (data: { referenceImageUrl: string; extractionStatus: string }) => {
    setReferenceImageUrl(data.referenceImageUrl)
    setExtractionStatus(data.extractionStatus as ExtractionStatus)
  }

  // 处理提取状态变化
  const handleStatusChange = (status: ExtractionStatus, message?: string) => {
    setExtractionStatus(status)
    setExtractionMessage(message || null)
  }

  // 处理文件选择（创建模式）
  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setExtractionStatus('pending')
  }

  // 关闭弹窗
  const handleClose = () => {
    // 清理轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    onClose()
  }

  // 弹窗底部按钮
  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={handleClose}
        disabled={isSubmitting}
        className="glass-btn-base glass-btn-secondary px-4 py-2 text-sm disabled:opacity-50"
      >
        {t('cancel')}
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="glass-btn-base glass-btn-primary px-4 py-2 text-sm disabled:opacity-50 flex items-center gap-2"
      >
        {isSubmitting && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
        {t('save')}
      </button>
    </div>
  )

  return (
    <GlassModalShell
      open={isOpen}
      onClose={handleClose}
      title={isEditMode ? t('editStyle') : t('createStyle')}
      footer={footer}
      size="lg"
    >
      <div className="space-y-5">
        {/* 风格名称 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--glass-text-primary)]">
            {t('styleName')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={t('styleNamePlaceholder')}
            maxLength={50}
            className="glass-input-base w-full h-10 px-3 text-sm"
          />
          <p className="text-xs text-[var(--glass-text-tertiary)]">
            {formData.name.length}/50
          </p>
        </div>

        {/* 中文提示词 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--glass-text-primary)]">
            {t('promptZh')} <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.promptZh}
            onChange={(e) => updateField('promptZh', e.target.value)}
            placeholder={t('promptZhPlaceholder')}
            maxLength={2000}
            rows={4}
            className="glass-input-base w-full px-3 py-2 text-sm resize-none"
          />
          <p className="text-xs text-[var(--glass-text-tertiary)]">
            {formData.promptZh.length}/2000
          </p>
        </div>

        {/* 英文提示词 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--glass-text-primary)]">
            {t('promptEn')} <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.promptEn}
            onChange={(e) => updateField('promptEn', e.target.value)}
            placeholder={t('promptEnPlaceholder')}
            maxLength={2000}
            rows={4}
            className="glass-input-base w-full px-3 py-2 text-sm resize-none"
          />
          <p className="text-xs text-[var(--glass-text-tertiary)]">
            {formData.promptEn.length}/2000
          </p>
        </div>

        {/* 标签选择器 */}
        <StyleTagSelector
          value={formData.tags}
          onChange={(tags) => updateField('tags', tags)}
        />

        {/* 参考图上传 */}
        <ReferenceImageUpload
          styleId={createdStyleId || (isEditMode ? editStyle?.id : null) || null}
          referenceImageUrl={referenceImageUrl}
          extractionStatus={extractionStatus}
          extractionMessage={extractionMessage}
          onUploadSuccess={handleUploadSuccess}
          onStatusChange={handleStatusChange}
          onFileSelect={!isEditMode ? handleFileSelect : undefined}
          selectedFile={selectedFile}
        />

        {/* AI 提取提示 */}
        {extractionStatus === 'completed' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-tone-success-bg)] text-[var(--glass-tone-success-fg)] text-sm">
            <AppIcon name="check" className="w-4 h-4" />
            <span>{t('extractCompleted')}</span>
          </div>
        )}

        {extractionStatus === 'pending' && referenceImageUrl && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>{t('extracting')}</span>
          </div>
        )}
      </div>
    </GlassModalShell>
  )
}
