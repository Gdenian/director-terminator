/**
 * 用户风格 CRUD API
 * 路由：/api/user-styles
 * per D-30: POST（创建）、GET（列表）
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { ApiError, apiHandler } from '@/lib/api-errors'
import { createUserStyleSchema } from '@/lib/styles/style-schema'
import { createUserStyle, getUserStyles } from '@/lib/styles/style-service'
import { Prisma } from '@prisma/client'

// POST /api/user-styles - 创建新风格
export const POST = apiHandler(async (request: NextRequest) => {
  // 1. 认证（per D-31）
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  // 2. 解析并验证请求体（per D-37）
  const body = await request.json()
  const parsed = createUserStyleSchema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError('INVALID_PARAMS', {
      message: '请求参数验证失败',
      details: parsed.error.flatten(),
    })
  }

  // 3. 创建风格（service 层处理 $transaction 和数量上限）
  try {
    const style = await createUserStyle(session.user.id, parsed.data)
    return NextResponse.json({ style }, { status: 201 })
  } catch (error) {
    // 4. 唯一索引冲突检测（per D-35: P2002 -> 409 Conflict）
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError('CONFLICT', {
        message: '风格名称已存在',
        field: 'name',
      })
    }
    throw error
  }
})

// GET /api/user-styles - 获取当前用户所有风格
export const GET = apiHandler(async () => {
  // 1. 认证（per D-31）
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  // 2. 获取风格列表（per D-36: isSystem 不在响应中）
  const styles = await getUserStyles(session.user.id)
  return NextResponse.json({ styles })
})
