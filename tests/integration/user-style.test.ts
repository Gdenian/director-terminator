import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../helpers/prisma'
import { randomUUID } from 'node:crypto'

describe('user-style integration', () => {
  // 每个测试前清理数据，保证测试隔离
  beforeEach(async () => {
    // 先删风格，再删用户（外键级联）
    await prisma.userStyle.deleteMany()
    await prisma.user.deleteMany()
  })

  // 测试 1: 创建 UserStyle 记录后可通过 prisma.userStyle.findUnique 查询到
  it('创建 UserStyle 记录后可被 findUnique 查询到', async () => {
    const user = await prisma.user.create({
      data: {
        name: `style_user_${randomUUID().slice(0, 8)}`,
        email: `style_${randomUUID().slice(0, 8)}@example.com`,
      },
    })

    const style = await prisma.userStyle.create({
      data: {
        userId: user.id,
        name: '我的风格',
        promptZh: '水彩插画风格',
        promptEn: 'Watercolor illustration style',
      },
    })

    const found = await prisma.userStyle.findUnique({ where: { id: style.id } })
    expect(found).not.toBeNull()
    expect(found!.id).toBe(style.id)
    expect(found!.name).toBe('我的风格')
  })

  // 测试 2: UserStyle 记录包含正确字段（id, name, promptZh, promptEn, isSystem, createdAt, updatedAt）
  it('UserStyle 记录包含所有必需字段且类型正确', async () => {
    const user = await prisma.user.create({
      data: {
        name: `style_user_${randomUUID().slice(0, 8)}`,
        email: `style_${randomUUID().slice(0, 8)}@example.com`,
      },
    })

    const style = await prisma.userStyle.create({
      data: {
        userId: user.id,
        name: '测试风格',
        promptZh: '赛璐璐上色风格',
        promptEn: 'Cel shading anime style',
      },
    })

    // id 为 uuid 格式
    expect(style.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    expect(style.name).toBe('测试风格')
    expect(style.promptZh).toBe('赛璐璐上色风格')
    expect(style.promptEn).toBe('Cel shading anime style')
    expect(style.isSystem).toBe(false) // 默认 false
    expect(style.createdAt).toBeInstanceOf(Date)
    expect(style.updatedAt).toBeInstanceOf(Date)
  })

  // 测试 3: tags 和 referenceImageUrl 为可选字段，不传时为 null
  it('tags 和 referenceImageUrl 为可选字段，不传时为 null', async () => {
    const user = await prisma.user.create({
      data: {
        name: `style_user_${randomUUID().slice(0, 8)}`,
        email: `style_${randomUUID().slice(0, 8)}@example.com`,
      },
    })

    const style = await prisma.userStyle.create({
      data: {
        userId: user.id,
        name: '无标签风格',
        promptZh: '简约风格',
        promptEn: 'Minimalist style',
        // 不传 tags 和 referenceImageUrl
      },
    })

    expect(style.tags).toBeNull()
    expect(style.referenceImageUrl).toBeNull()
  })

  // 测试 4: userId + name 联合唯一约束生效——相同 userId + name 二次创建抛出唯一约束错误
  it('userId + name 联合唯一约束冲突时抛出 P2002 错误', async () => {
    const user = await prisma.user.create({
      data: {
        name: `style_user_${randomUUID().slice(0, 8)}`,
        email: `style_${randomUUID().slice(0, 8)}@example.com`,
      },
    })

    await prisma.userStyle.create({
      data: {
        userId: user.id,
        name: '唯一风格',
        promptZh: '测试',
        promptEn: 'Test',
      },
    })

    // 第二次创建同名风格应抛出 P2002 错误
    await expect(
      prisma.userStyle.create({
        data: {
          userId: user.id,
          name: '唯一风格', // 同名
          promptZh: '测试2',
          promptEn: 'Test2',
        },
      }),
    ).rejects.toMatchObject({
      code: 'P2002',
    })
  })

  // 测试 5: 删除关联 User 时，UserStyle 记录级联删除（onDelete: Cascade）
  it('删除关联 User 时 UserStyle 记录级联删除', async () => {
    const user = await prisma.user.create({
      data: {
        name: `style_user_${randomUUID().slice(0, 8)}`,
        email: `style_${randomUUID().slice(0, 8)}@example.com`,
      },
    })

    await prisma.userStyle.create({
      data: {
        userId: user.id,
        name: '级联测试风格',
        promptZh: '测试',
        promptEn: 'Test',
      },
    })

    // 删除用户
    await prisma.user.delete({ where: { id: user.id } })

    // 风格应已被级联删除
    const count = await prisma.userStyle.count()
    expect(count).toBe(0)
  })
})
