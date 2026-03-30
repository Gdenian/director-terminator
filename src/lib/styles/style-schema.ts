/**
 * 用户风格 Zod 验证 Schema
 * per D-37: 使用 Zod 进行请求体验证
 */

import { z } from 'zod'

/** 创建风格请求 Schema */
export const createUserStyleSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  promptZh: z.string().min(1).max(2000).trim(),
  promptEn: z.string().max(2000).trim().optional().or(z.literal('')), // 英文提示词可选
  tags: z.array(z.string()).optional(),
  referenceImageUrl: z.string().url().optional(),
})

export type CreateUserStyleInput = z.infer<typeof createUserStyleSchema>

/** 更新风格请求 Schema（所有字段可选） */
export const updateUserStyleSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  promptZh: z.string().min(1).max(2000).trim().optional(),
  promptEn: z.string().min(1).max(2000).trim().optional(),
  tags: z.array(z.string()).optional(),
  referenceImageUrl: z.string().url().nullish().optional(),
})

export type UpdateUserStyleInput = z.infer<typeof updateUserStyleSchema>
