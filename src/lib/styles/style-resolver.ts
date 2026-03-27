/**
 * 风格解析器
 *
 * 支持系统预设（ART_STYLES 常量）和用户自定义风格（UserStyle DB 查询）两类标识符。
 * 用于在图片/视频生成时，根据用户选择的风格动态注入提示词。
 *
 * 设计决策（per D-10, D-12, D-14, D-15）：
 * - 函数名：`resolveStylePrompt`（不是 `getStylePrompt`）
 * - 返回类型：`Promise<string | null>`（不是 `UserStylePrompt`）
 * - userId 必须在 DB 查询的 where 条件中（安全性）
 * - 找不到时返回 null 而非空字符串
 * - 预设风格路径不查库（性能优化）
 * - 不做数量检查（Phase 5 才做）
 * - 不做缓存（按需 Phase 4 评估）
 */

import { prisma } from '@/lib/prisma'
import { ART_STYLES } from '@/lib/constants'
import { isUserStyle, extractUserStyleId } from './style-namespace'

/**
 * 异步解析风格提示词
 *
 * @param artStyle - 风格标识符，如 'american-comic' 或 'user:uuid'
 * @param userId - 当前用户 ID（用户自定义风格查询时必须参与，防止跨用户访问）
 * @param locale - 语言：'zh' | 'en'
 * @returns 对应风格的提示词字符串，或 null（找不到时）
 */
export async function resolveStylePrompt(
  artStyle: string,
  userId: string,
  locale: 'zh' | 'en',
): Promise<string | null> {
  // 空字符串直接返回 null
  if (!artStyle) {
    return null
  }

  // 系统预设路径：直接从常量查找，不查库
  if (!isUserStyle(artStyle)) {
    const style = ART_STYLES.find((s) => s.value === artStyle)
    if (!style) return null
    return locale === 'en' ? style.promptEn : style.promptZh
  }

  // 用户自定义路径：从 DB 查询，userId 必须参与（防止用户 A 访问用户 B 的风格）
  const styleId = extractUserStyleId(artStyle)
  const userStyle = await prisma.userStyle.findUnique({
    where: {
      id: styleId,
      userId, // 防止用户 A 访问用户 B 的风格
    },
    select: {
      promptZh: true,
      promptEn: true,
    },
  })

  if (!userStyle) return null
  return locale === 'en' ? userStyle.promptEn : userStyle.promptZh
}
