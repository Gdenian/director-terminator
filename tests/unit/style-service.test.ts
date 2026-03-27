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

// ===== 新增：CRUD 函数测试 =====

// 导入新增的 CRUD 函数
import {
  createUserStyle,
  getUserStyles,
  updateUserStyle,
  deleteUserStyle,
  MAX_STYLE_LIMIT,
} from '@/lib/styles/style-service'

// Mock 整个 prisma 模块（覆盖前面的 mock）
vi.mock('@/lib/prisma', () => {
  const mockUserStyle = {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
  return {
    prisma: {
      $transaction: vi.fn(async (callback) => {
        // Inside transaction, tx is used as the prisma client
        return callback({
          userStyle: mockUserStyle,
        })
      }),
      userStyle: mockUserStyle,
    },
  }
})

// Mock resolveStylePrompt
vi.mock('@/lib/styles/style-resolver', () => ({
  resolveStylePrompt: vi.fn().mockResolvedValue('mocked prompt'),
}))

// Mock toUserStyleIdentifier
vi.mock('@/lib/styles/style-namespace', () => ({
  toUserStyleIdentifier: (id: string) => `user:${id}`,
}))

const TEST_USER_ID = 'user-123'
const TEST_STYLE_ID = 'style-456'

const mockStyle = {
  id: TEST_STYLE_ID,
  userId: TEST_USER_ID,
  name: 'Test Style',
  promptZh: '中文提示词',
  promptEn: 'English prompt',
  tags: 'tag1,tag2',
  referenceImageUrl: null,
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('MAX_STYLE_LIMIT', () => {
  it('默认值为 20', () => {
    expect(MAX_STYLE_LIMIT).toBe(20)
  })
})

describe('createUserStyle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: 创建成功
  it('风格数量未达上限时创建成功', async () => {
    vi.mocked(prisma.userStyle.count).mockResolvedValue(5)
    vi.mocked(prisma.userStyle.create).mockResolvedValue(mockStyle as never)

    const result = await createUserStyle(TEST_USER_ID, {
      name: 'Test Style',
      promptZh: '中文提示词',
      promptEn: 'English prompt',
      tags: ['tag1', 'tag2'],
    })

    expect(result.id).toBe(TEST_STYLE_ID)
    expect(prisma.userStyle.count).toHaveBeenCalledWith({ where: { userId: TEST_USER_ID } })
    expect(prisma.userStyle.create).toHaveBeenCalled()
  })

  // Test 2: 达到上限时抛出 QUOTA_EXCEEDED
  it('风格数量达到上限时抛出 ApiError(QUOTA_EXCEEDED, 429)', async () => {
    vi.mocked(prisma.userStyle.count).mockResolvedValue(MAX_STYLE_LIMIT)

    await expect(
      createUserStyle(TEST_USER_ID, {
        name: 'Test Style',
        promptZh: '中文提示词',
        promptEn: 'English prompt',
      }),
    ).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
      status: 429,
    })

    expect(prisma.userStyle.create).not.toHaveBeenCalled()
  })

  // Test 3: 计数为上限-1 时仍可创建
  it('风格数量为上限-1 时可以创建（临界值）', async () => {
    vi.mocked(prisma.userStyle.count).mockResolvedValue(MAX_STYLE_LIMIT - 1)
    vi.mocked(prisma.userStyle.create).mockResolvedValue(mockStyle as never)

    const result = await createUserStyle(TEST_USER_ID, {
      name: 'Test Style',
      promptZh: '中文提示词',
      promptEn: 'English prompt',
    })

    expect(result.id).toBe(TEST_STYLE_ID)
  })
})

describe('getUserStyles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: 返回用户所有风格
  it('返回当前用户的所有风格，按 createdAt 倒序', async () => {
    const styles = [mockStyle, { ...mockStyle, id: 'style-2', name: 'Style 2' }]
    vi.mocked(prisma.userStyle.findMany).mockResolvedValue(styles as never)

    const result = await getUserStyles(TEST_USER_ID)

    expect(result).toHaveLength(2)
    expect(prisma.userStyle.findMany).toHaveBeenCalledWith({
      where: { userId: TEST_USER_ID },
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
  })

  // Test 2: 无风格时返回空数组
  it('用户无风格时返回空数组', async () => {
    vi.mocked(prisma.userStyle.findMany).mockResolvedValue([] as never)

    const result = await getUserStyles(TEST_USER_ID)

    expect(result).toEqual([])
  })

  // Test 3: 不返回 isSystem 字段
  it('返回结果不包含 isSystem 字段', async () => {
    // mock without isSystem to match what select would return
    vi.mocked(prisma.userStyle.findMany).mockResolvedValue([{
      id: TEST_STYLE_ID,
      userId: TEST_USER_ID,
      name: 'Test Style',
      promptZh: '中文提示词',
      promptEn: 'English prompt',
      tags: 'tag1,tag2',
      referenceImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }] as never)

    const result = await getUserStyles(TEST_USER_ID)

    expect(result[0]).not.toHaveProperty('isSystem')
  })
})

describe('updateUserStyle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: 更新成功
  it('更新非系统风格成功', async () => {
    // assertUserStyleNotSystem mock
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({ isSystem: false } as never)
    vi.mocked(prisma.userStyle.update).mockResolvedValue({
      ...mockStyle,
      name: 'Updated Name',
    } as never)

    const result = await updateUserStyle(TEST_STYLE_ID, TEST_USER_ID, { name: 'Updated Name' })

    expect(result.name).toBe('Updated Name')
    expect(prisma.userStyle.update).toHaveBeenCalled()
  })

  // Test 2: 系统风格抛出 403
  it('更新系统风格时抛出 ApiError(FORBIDDEN, 403)', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({ isSystem: true } as never)

    await expect(
      updateUserStyle(TEST_STYLE_ID, TEST_USER_ID, { name: 'Hacked' }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    })

    expect(prisma.userStyle.update).not.toHaveBeenCalled()
  })

  // Test 3: 部分更新只更新指定字段
  it('部分更新只更新指定的字段', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({ isSystem: false } as never)
    vi.mocked(prisma.userStyle.update).mockResolvedValue({
      ...mockStyle,
      promptZh: 'New Chinese',
    } as never)

    await updateUserStyle(TEST_STYLE_ID, TEST_USER_ID, { promptZh: 'New Chinese' })

    expect(prisma.userStyle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TEST_STYLE_ID, userId: TEST_USER_ID },
        data: expect.objectContaining({ promptZh: 'New Chinese' }),
      }),
    )
  })
})

describe('deleteUserStyle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 1: 删除成功
  it('删除非系统风格成功', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({ isSystem: false } as never)
    vi.mocked(prisma.userStyle.delete).mockResolvedValue(mockStyle as never)

    await expect(deleteUserStyle(TEST_STYLE_ID, TEST_USER_ID)).resolves.toBeUndefined()
    expect(prisma.userStyle.delete).toHaveBeenCalledWith({
      where: { id: TEST_STYLE_ID, userId: TEST_USER_ID },
    })
  })

  // Test 2: 系统风格抛出 403
  it('删除系统风格时抛出 ApiError(FORBIDDEN, 403)', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue({ isSystem: true } as never)

    await expect(deleteUserStyle(TEST_STYLE_ID, TEST_USER_ID)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    })

    expect(prisma.userStyle.delete).not.toHaveBeenCalled()
  })

  // Test 3: 记录不存在时不抛出（assertUserStyleNotSystem 行为）
  it('记录不存在时 assertUserStyleNotSystem 不抛出', async () => {
    vi.mocked(prisma.userStyle.findUnique).mockResolvedValue(null)

    // 记录不存在时，findUnique 返回 null，assertUserStyleNotSystem 不检查 isSystem 直接通过
    await expect(deleteUserStyle('non-existent', TEST_USER_ID)).resolves.toBeUndefined()
  })
})
