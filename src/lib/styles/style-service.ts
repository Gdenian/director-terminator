/**
 * 风格服务层
 *
 * 提供用户风格相关业务逻辑的保护函数和工具。
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-errors'
import { resolveStylePrompt } from './style-resolver'
import { toUserStyleIdentifier } from './style-namespace'

/** 每用户最大自定义风格数量（per D-32） */
export const MAX_STYLE_LIMIT = 20

interface CreateUserStyleInput {
  name: string
  promptZh: string
  promptEn: string
  tags?: string[]
  referenceImageUrl?: string
}

export async function createUserStyle(
  userId: string,
  data: CreateUserStyleInput,
): Promise<{ id: string; name: string; promptZh: string; promptEn: string; tags: string | null; referenceImageUrl: string | null; createdAt: Date; updatedAt: Date }> {
  return await prisma.$transaction(async (tx) => {
    // 1. 计数检查（per D-32: $transaction 保护）
    const count = await tx.userStyle.count({ where: { userId } })
    if (count >= MAX_STYLE_LIMIT) {
      throw new ApiError('QUOTA_EXCEEDED', {
        message: `已达到风格数量上限（${MAX_STYLE_LIMIT} 个）`,
        limit: MAX_STYLE_LIMIT,
        current: count,
      })
    }

    // 2. 创建风格
    const style = await tx.userStyle.create({
      data: {
        userId,
        name: data.name.trim(),
        promptZh: data.promptZh.trim(),
        promptEn: data.promptEn.trim(),
        tags: data.tags?.join(',') ?? null,
        referenceImageUrl: data.referenceImageUrl ?? null,
      },
    })

    // 3. 验证提示词可解析（per D-34）
    const identifier = toUserStyleIdentifier(style.id)
    const resolved = await resolveStylePrompt(identifier, userId, 'zh')
    if (!resolved) {
      console.warn(`[style-service] createUserStyle: resolveStylePrompt returned null for ${identifier}`)
    }

    return style
  })
}

export async function getUserStyles(
  userId: string,
): Promise<Array<{ id: string; name: string; promptZh: string; promptEn: string; tags: string | null; referenceImageUrl: string | null; createdAt: Date; updatedAt: Date }>> {
  return await prisma.userStyle.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      promptZh: true,
      promptEn: true,
      tags: true,
      referenceImageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

interface UpdateUserStyleInput {
  name?: string
  promptZh?: string
  promptEn?: string
  tags?: string[]
  referenceImageUrl?: string | null
}

export async function updateUserStyle(
  id: string,
  userId: string,
  data: UpdateUserStyleInput,
): Promise<{ id: string; name: string; promptZh: string; promptEn: string; tags: string | null; referenceImageUrl: string | null; createdAt: Date; updatedAt: Date }> {
  // 1. 保护系统预设（per D-33）
  await assertUserStyleNotSystem(id, userId)

  // 2. 构建更新数据
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.promptZh !== undefined) updateData.promptZh = data.promptZh.trim()
  if (data.promptEn !== undefined) updateData.promptEn = data.promptEn.trim()
  if (data.tags !== undefined) updateData.tags = data.tags.join(',') ?? null
  if (data.referenceImageUrl !== undefined) updateData.referenceImageUrl = data.referenceImageUrl

  return await prisma.userStyle.update({
    where: { id, userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      promptZh: true,
      promptEn: true,
      tags: true,
      referenceImageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function deleteUserStyle(id: string, userId: string): Promise<void> {
  // 1. 保护系统预设（per D-33）
  await assertUserStyleNotSystem(id, userId)

  // 2. 删除记录
  await prisma.userStyle.delete({ where: { id, userId } })
}

/**
 * 断言 UserStyle 记录不是系统预设。
 * 当 isSystem=true 时抛出 403 错误，防止删除/编辑系统预设。
 *
 * @param userStyleId - UserStyle 记录的 id
 * @param userId - 当前用户 ID（用于查询）
 * @throws ApiError('FORBIDDEN') 当记录是系统预设时
 */
export async function assertUserStyleNotSystem(
  userStyleId: string,
  userId: string,
): Promise<void> {
  const style = await prisma.userStyle.findUnique({
    where: { id: userStyleId, userId },
    select: { isSystem: true },
  })

  if (style?.isSystem === true) {
    throw new ApiError('FORBIDDEN', {
      message: '系统预设不可修改或删除',
      styleId: userStyleId,
    })
  }
}
