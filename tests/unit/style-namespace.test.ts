import { describe, expect, it } from 'vitest'
import { isUserStyle, extractUserStyleId, toUserStyleIdentifier } from '@/lib/styles/style-namespace'

describe('isUserStyle', () => {
  // 自定义风格标识符 — 应返回 true
  it('标准自定义风格标识符 user:uuid 返回 true', () => {
    expect(isUserStyle('user:abc-123-def')).toBe(true)
  })

  it('标准 UUID 格式的 user: 前缀标识符返回 true', () => {
    expect(isUserStyle('user:550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('空 uuid 但前缀存在也返回 true', () => {
    expect(isUserStyle('user:')).toBe(true)
  })

  // 系统预设标识符 — 应返回 false
  it('american-comic 系统预设返回 false', () => {
    expect(isUserStyle('american-comic')).toBe(false)
  })

  it('chinese-comic 系统预设返回 false', () => {
    expect(isUserStyle('chinese-comic')).toBe(false)
  })

  it('japanese-anime 系统预设返回 false', () => {
    expect(isUserStyle('japanese-anime')).toBe(false)
  })

  it('realistic 系统预设返回 false', () => {
    expect(isUserStyle('realistic')).toBe(false)
  })

  // 边界情况
  it('空字符串返回 false', () => {
    expect(isUserStyle('')).toBe(false)
  })

  it('大小写不匹配 USER:abc 返回 false（大小写敏感）', () => {
    expect(isUserStyle('USER:abc')).toBe(false)
  })

  it('user:abc 以外的前缀返回 false', () => {
    expect(isUserStyle('style:abc')).toBe(false)
  })

  it('包含 user: 但位置不对返回 false', () => {
    expect(isUserStyle('prefix-user:abc')).toBe(false)
  })
})

describe('extractUserStyleId', () => {
  it('标准 user:abc-123 提取出 abc-123', () => {
    expect(extractUserStyleId('user:abc-123')).toBe('abc-123')
  })

  it('标准 UUID 格式完整提取', () => {
    expect(extractUserStyleId('user:550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    )
  })

  it('空 id 情况返回空字符串', () => {
    expect(extractUserStyleId('user:')).toBe('')
  })

  it('带特殊字符的 id 正确提取', () => {
    expect(extractUserStyleId('user:abc_123-def')).toBe('abc_123-def')
  })
})

describe('toUserStyleIdentifier', () => {
  it('普通字符串 id 拼接 user: 前缀', () => {
    expect(toUserStyleIdentifier('abc-123')).toBe('user:abc-123')
  })

  it('标准 UUID 格式拼接 user: 前缀', () => {
    expect(toUserStyleIdentifier('550e8400-e29b-41d4-a716-446655440000')).toBe(
      'user:550e8400-e29b-41d4-a716-446655440000',
    )
  })

  it('空字符串拼接后为 user:', () => {
    expect(toUserStyleIdentifier('')).toBe('user:')
  })
})

describe('round-trip 验证', () => {
  it('extractUserStyleId 和 toUserStyleIdentifier 互为逆运算', () => {
    const originalId = 'abc-123'
    const extracted = extractUserStyleId('user:abc-123')
    const roundTripped = toUserStyleIdentifier(extracted)
    expect(roundTripped).toBe('user:abc-123')
    expect(toUserStyleIdentifier(originalId)).toBe('user:abc-123')
  })

  it('UUID 格式 round-trip 正确', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    const extracted = extractUserStyleId(toUserStyleIdentifier(uuid))
    expect(extracted).toBe(uuid)
  })
})
