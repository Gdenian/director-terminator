/**
 * 风格服务层
 *
 * 提供用户风格相关业务逻辑的保护函数和工具。
 */

import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-errors'

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
