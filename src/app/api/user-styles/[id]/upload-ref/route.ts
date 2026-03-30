/**
 * 用户风格参考图上传 API
 * POST /api/user-styles/:id/upload-ref
 *
 * 流程：
 * 1. 认证用户
 * 2. 验证风格存在且属于当前用户
 * 3. 解析 multipart/form-data
 * 4. 验证文件类型和大小
 * 5. 上传到 S3
 * 6. 更新风格记录
 * 7. 触发异步提取任务
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { ApiError, apiHandler } from '@/lib/api-errors'
import { uploadObject } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { submitTask } from '@/lib/task/submitter'
import { TASK_TYPE } from '@/lib/task/types'
import { resolveRequiredTaskLocale } from '@/lib/task/resolve-locale'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/user-styles/:id/upload-ref - 上传参考图
export const POST = apiHandler(async (request: NextRequest, ctx: RouteParams) => {
  // 1. 认证
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  // 2. 获取 id 参数
  const { id } = await ctx.params
  if (!id) {
    throw new ApiError('INVALID_PARAMS', { message: '风格 ID 不能为空' })
  }

  // 3. 验证风格存在且属于当前用户
  const existing = await prisma.userStyle.findUnique({
    where: { id },
    select: { id: true, userId: true, isSystem: true },
  })
  if (!existing) {
    throw new ApiError('NOT_FOUND', { message: '风格不存在' })
  }
  if (existing.userId !== session.user.id) {
    throw new ApiError('FORBIDDEN', { message: '无权访问此风格' })
  }
  if (existing.isSystem) {
    throw new ApiError('FORBIDDEN', { message: '系统预设不可修改' })
  }

  // 4. 解析 multipart/form-data
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    throw new ApiError('INVALID_PARAMS', { message: '请上传图片文件' })
  }

  // 5. 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new ApiError('INVALID_PARAMS', {
      message: '仅支持 JPEG、PNG、WebP 格式图片',
    })
  }

  // 6. 验证文件大小 (最大 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    throw new ApiError('INVALID_PARAMS', {
      message: '图片大小不能超过 10MB',
    })
  }

  // 7. 上传到 S3（保留原始扩展名）
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() || file.type.split('/')[1] || 'jpg'
  const key = `user-styles/${session.user.id}/${id}/ref.${ext}`
  await uploadObject(buffer, key, 3, file.type)

  // 8. 更新风格记录，触发异步提取
  const updated = await prisma.userStyle.update({
    where: { id },
    data: {
      referenceImageUrl: key,
      extractionStatus: 'pending',
      extractionMessage: null,
    },
    select: {
      id: true,
      name: true,
      referenceImageUrl: true,
      extractionStatus: true,
    },
  })

  // 9. 触发异步提取任务
  const userPref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: { analysisModel: true },
  })

  const locale = resolveRequiredTaskLocale(request, null)
  await submitTask({
    userId: session.user.id,
    locale,
    projectId: 'user-style', // 用户级别任务，不关联具体项目
    type: TASK_TYPE.STYLE_EXTRACT,
    targetType: 'user-style',
    targetId: id,
    payload: {
      styleId: id,
      referenceImageUrl: key,
      analysisModel: userPref?.analysisModel ?? null,
    },
  })

  return NextResponse.json({
    referenceImageUrl: updated.referenceImageUrl,
    extractionStatus: updated.extractionStatus,
  })
})
