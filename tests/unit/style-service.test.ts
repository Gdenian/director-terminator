/**
 * 风格服务单元测试
 *
 * 测试 assertUserStyleNotSystem 函数的保护逻辑。
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { assertUserStyleNotSystem } from '@/lib/styles/style-service'
import { ApiError } from '@/lib/api-errors'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userStyle: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('assertUserStyleNotSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: isSystem=false 时不抛出
  it('isSystem=false 时 resolve，不抛出异常', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({
      isSystem: false,
    } as never)

    await expect(
      assertUserStyleNotSystem('style-id-123', 'user-id-456'),
    ).resolves.toBeUndefined()

    expect(prisma.userStyle.findUnique).toHaveBeenCalledWith({
      where: { id: 'style-id-123', userId: 'user-id-456' },
      select: { isSystem: true },
    })
  })

  // Test 2: isSystem=true 时抛出 403
  it('isSystem=true 时抛出 ApiError，status=403', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({
      isSystem: true,
    } as never)

    await expect(
      assertUserStyleNotSystem('style-id-123', 'user-id-456'),
    ).rejects.toThrow(ApiError)

    await expect(
      assertUserStyleNotSystem('style-id-123', 'user-id-456'),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    })

    await expect(
      assertUserStyleNotSystem('style-id-123', 'user-id-456'),
    ).rejects.toThrow('系统预设不可修改或删除')
  })

  // Test 3: 记录不存在时 resolve
  it('记录不存在时 resolve（不检查 isSystem）', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue(null)

    await expect(
      assertUserStyleNotSystem('non-existent-id', 'user-id-456'),
    ).resolves.toBeUndefined()
  })

  // Test 4: 任意 userId 调用均正确
  it('不同 userId 调用均正确执行查询', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({
      isSystem: false,
    } as never)

    await assertUserStyleNotSystem('style-id', 'user-a')
    await assertUserStyleNotSystem('style-id', 'user-b')

    expect(prisma.userStyle.findUnique).toHaveBeenCalledTimes(2)
    expect(prisma.userStyle.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: 'style-id', userId: 'user-a' },
      select: { isSystem: true },
    })
    expect(prisma.userStyle.findUnique).toHaveBeenNthCalledWith(2, {
      where: { id: 'style-id', userId: 'user-b' },
      select: { isSystem: true },
    })
  })

  // Test 5: isSystem === null 或 undefined 不抛出
  it('isSystem 为 null 或 undefined 时不抛出', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({
      isSystem: null,
    } as never)

    await expect(
      assertUserStyleNotSystem('style-id', 'user-id'),
    ).resolves.toBeUndefined()
  })
})
