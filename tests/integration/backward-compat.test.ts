/**
 * 向后兼容集成测试
 *
 * 验证现有项目 artStyle 数据（"american-comic" 等）经新解析器 resolveStylePrompt 解析后
 * 与原 getArtStylePrompt 结果一致。
 *
 * 对应需求: INTEG-02
 * 验证策略: 8 个断言验证 4 预设风格 x 2 locale
 *
 * 注意：预设风格路径（american-comic, chinese-comic, japanese-anime, realistic）
 * 不查询数据库，因此不需要创建用户或风格记录。userId 仅作为 resolveStylePrompt
 * 的必需参数传入，但 preset 路径不会实际使用它。
 */

import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { resolveStylePrompt } from '@/lib/styles/style-resolver'
import { getArtStylePrompt } from '@/lib/constants'

describe('backward-compat', () => {
  // Test 1: american-comic zh
  it('resolveStylePrompt(american-comic, userId, zh) === getArtStylePrompt(american-comic, zh)', async () => {
    const userId = randomUUID() // 任意合法 uuid，预设风格路径不查库

    const resolved = await resolveStylePrompt('american-comic', userId, 'zh')
    const expected = getArtStylePrompt('american-comic', 'zh')
    expect(resolved).toBe(expected)
  })

  // Test 2: american-comic en
  it('resolveStylePrompt(american-comic, userId, en) === getArtStylePrompt(american-comic, en)', async () => {
    const userId = randomUUID()

    const resolved = await resolveStylePrompt('american-comic', userId, 'en')
    const expected = getArtStylePrompt('american-comic', 'en')
    expect(resolved).toBe(expected)
  })

  // Test 3: chinese-comic zh
  it('resolveStylePrompt(chinese-comic, userId, zh) === getArtStylePrompt(chinese-comic, zh)', async () => {
    const userId = randomUUID()

    const resolved = await resolveStylePrompt('chinese-comic', userId, 'zh')
    const expected = getArtStylePrompt('chinese-comic', 'zh')
    expect(resolved).toBe(expected)
  })

  // Test 4: chinese-comic en
  it('resolveStylePrompt(chinese-comic, userId, en) === getArtStylePrompt(chinese-comic, en)', async () => {
    const userId = randomUUID()

    const resolved = await resolveStylePrompt('chinese-comic', userId, 'en')
    const expected = getArtStylePrompt('chinese-comic', 'en')
    expect(resolved).toBe(expected)
  })

  // Test 5: japanese-anime zh
  it('resolveStylePrompt(japanese-anime, userId, zh) === getArtStylePrompt(japanese-anime, zh)', async () => {
    const userId = randomUUID()

    const resolved = await resolveStylePrompt('japanese-anime', userId, 'zh')
    const expected = getArtStylePrompt('japanese-anime', 'zh')
    expect(resolved).toBe(expected)
  })

  // Test 6: japanese-anime en
  it('resolveStylePrompt(japanese-anime, userId, en) === getArtStylePrompt(japanese-anime, en)', async () => {
    const userId = randomUUID()

    const resolved = await resolveStylePrompt('japanese-anime', userId, 'en')
    const expected = getArtStylePrompt('japanese-anime', 'en')
    expect(resolved).toBe(expected)
  })

  // Test 7: realistic zh
  it('resolveStylePrompt(realistic, userId, zh) === getArtStylePrompt(realistic, zh)', async () => {
    const userId = randomUUID()

    const resolved = await resolveStylePrompt('realistic', userId, 'zh')
    const expected = getArtStylePrompt('realistic', 'zh')
    expect(resolved).toBe(expected)
  })

  // Test 8: realistic en
  it('resolveStylePrompt(realistic, userId, en) === getArtStylePrompt(realistic, en)', async () => {
    const userId = randomUUID()

    const resolved = await resolveStylePrompt('realistic', userId, 'en')
    const expected = getArtStylePrompt('realistic', 'en')
    expect(resolved).toBe(expected)
  })
})
