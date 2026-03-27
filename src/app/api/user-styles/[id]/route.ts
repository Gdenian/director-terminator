/**
 * 用户风格 CRUD API - 单条操作
 * 路由：/api/user-styles/:id
 * per D-30: PUT（更新）、DELETE（删除）
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { ApiError, apiHandler } from '@/lib/api-errors'
import { updateUserStyleSchema } from '@/lib/styles/style-schema'
import { updateUserStyle, deleteUserStyle } from '@/lib/styles/style-service'
import { Prisma } from '@prisma/client'

type RouteParams = { params: Promise<{ id: string }> }

// PUT /api/user-styles/:id - 更新风格
export const PUT = apiHandler(async (request: NextRequest, ctx: RouteParams) => {
  // 1. 认证（per D-31）
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  // 2. 获取 id 参数
  const { id } = await ctx.params
  if (!id) {
    throw new ApiError('INVALID_PARAMS', { message: '风格 ID 不能为空' })
  }

  // 3. 解析并验证请求体（per D-37）
  const body = await request.json()
  const parsed = updateUserStyleSchema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError('INVALID_PARAMS', {
      message: '请求参数验证失败',
      details: parsed.error.flatten(),
    })
  }

  // 4. 检查风格是否存在且属于当前用户
  const existing = await prisma.userStyle.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!existing) {
    throw new ApiError('NOT_FOUND', { message: '风格不存在' })
  }
  if (existing.userId !== session.user.id) {
    throw new ApiError('FORBIDDEN', { message: '无权访问此风格' })
  }

  // 5. 更新风格（service 层处理 isSystem 保护）
  try {
    const style = await updateUserStyle(id, session.user.id, parsed.data)
    return NextResponse.json({ style })
  } catch (error) {
    // 唯一索引冲突检测（per D-35）
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError('CONFLICT', {
        message: '风格名称已存在',
        field: 'name',
      })
    }
    throw error
  }
})

// DELETE /api/user-styles/:id - 删除风格
export const DELETE = apiHandler(async (_request: NextRequest, ctx: RouteParams) => {
  // 1. 认证（per D-31）
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  // 2. 获取 id 参数
  const { id } = await ctx.params
  if (!id) {
    throw new ApiError('INVALID_PARAMS', { message: '风格 ID 不能为空' })
  }

  // 3. 检查风格是否存在且属于当前用户
  const existing = await prisma.userStyle.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!existing) {
    throw new ApiError('NOT_FOUND', { message: '风格不存在' })
  }
  if (existing.userId !== session.user.id) {
    throw new ApiError('FORBIDDEN', { message: '无权访问此风格' })
  }

  // 4. 删除风格（service 层处理 isSystem 保护）
  await deleteUserStyle(id, session.user.id)
  return NextResponse.json({ success: true })
})
