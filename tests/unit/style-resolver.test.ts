import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resolveStylePrompt } from '@/lib/styles/style-resolver'

// Mock Prisma client
const mockPrisma = {
  userStyle: {
    findUnique: vi.fn(),
  },
}
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

describe('预设风格', () => {
  // Test 1: american-comic zh/en
  it('预设风格 american-comic 返回中文 prompt', async () => {
    const result = await resolveStylePrompt('american-comic', 'user-123', 'zh')
    expect(result).toBe('日式动漫风格')
  })

  it('预设风格 american-comic 返回英文 prompt', async () => {
    const result = await resolveStylePrompt('american-comic', 'user-123', 'en')
    expect(result).toBe('Japanese anime style')
  })

  // Test 2: chinese-comic zh/en
  it('预设风格 chinese-comic 返回中文 prompt', async () => {
    const result = await resolveStylePrompt('chinese-comic', 'user-123', 'zh')
    expect(result).toBe('现代高质量漫画风格，动漫风格，细节丰富精致，线条锐利干净，质感饱满，超清，干净的画面风格，2D风格，动漫风格。')
  })

  it('预设风格 chinese-comic 返回英文 prompt', async () => {
    const result = await resolveStylePrompt('chinese-comic', 'user-123', 'en')
    expect(result).toBe('Modern premium Chinese comic style, rich details, clean sharp line art, full texture, ultra-clear 2D anime aesthetics.')
  })

  // Test 2 continued: japanese-anime zh/en
  it('预设风格 japanese-anime 返回中文 prompt', async () => {
    const result = await resolveStylePrompt('japanese-anime', 'user-123', 'zh')
    expect(result).toBe('现代日系动漫风格，赛璐璐上色，清晰干净的线条，视觉小说CG感。高质量2D风格')
  })

  it('预设风格 japanese-anime 返回英文 prompt', async () => {
    const result = await resolveStylePrompt('japanese-anime', 'user-123', 'en')
    expect(result).toBe('Modern Japanese anime style, cel shading, clean line art, visual-novel CG look, high-quality 2D style.')
  })

  // Test 3: realistic zh/en
  it('预设风格 realistic 返回中文 prompt', async () => {
    const result = await resolveStylePrompt('realistic', 'user-123', 'zh')
    expect(result).toBe('真实电影级画面质感，真实现实场景，色彩饱满通透，画面干净精致，真实感')
  })

  it('预设风格 realistic 返回英文 prompt', async () => {
    const result = await resolveStylePrompt('realistic', 'user-123', 'en')
    expect(result).toBe('Realistic cinematic look, real-world scene fidelity, rich transparent colors, clean and refined image quality.')
  })
})

describe('用户自定义风格', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 4: user:uuid exists in DB
  it('user:uuid 存在于 DB 时返回对应 prompt', async () => {
    mockPrisma.userStyle.findUnique.mockResolvedValue({
      promptZh: '自定义中文风格',
      promptEn: 'Custom English Style',
    })
    const result = await resolveStylePrompt('user:abc-123', 'user-123', 'zh')
    expect(result).toBe('自定义中文风格')
  })

  it('user:uuid 存在于 DB 时返回英文 prompt', async () => {
    mockPrisma.userStyle.findUnique.mockResolvedValue({
      promptZh: '自定义中文风格',
      promptEn: 'Custom English Style',
    })
    const result = await resolveStylePrompt('user:abc-123', 'user-123', 'en')
    expect(result).toBe('Custom English Style')
  })

  // Test 5: user:uuid not found in DB
  it('user:uuid 不存在于 DB 时返回 null', async () => {
    mockPrisma.userStyle.findUnique.mockResolvedValue(null)
    const result = await resolveStylePrompt('user:abc-123', 'user-123', 'zh')
    expect(result).toBeNull()
  })
})

describe('安全性验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 6: userId mismatch returns null
  it('user:uuid 存在但 userId 不匹配时返回 null（防止跨用户访问）', async () => {
    // 即使 DB 中有记录，但 userId 不匹配也应返回 null
    mockPrisma.userStyle.findUnique.mockResolvedValue({
      promptZh: '其他用户的风格',
      promptEn: 'Other user style',
    })
    const result = await resolveStylePrompt('user:abc-123', 'user-456', 'zh')
    expect(result).toBeNull()
  })
})

describe('无效输入', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test 7: unknown identifier
  it('未知标识符（非 user: 前缀且不在 ART_STYLES 中）返回 null', async () => {
    const result = await resolveStylePrompt('unknown-style', 'user-123', 'zh')
    expect(result).toBeNull()
  })

  // Test 8: empty string
  it('空字符串 artStyle 参数返回 null', async () => {
    const result = await resolveStylePrompt('', 'user-123', 'zh')
    expect(result).toBeNull()
  })
})
