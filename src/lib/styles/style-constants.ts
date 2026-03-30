/**
 * 风格相关常量
 * 客户端安全 - 无 Node.js 依赖
 */

/** 每用户最大自定义风格数量（per D-32） */
export const MAX_STYLE_LIMIT = 20

/** 预设标签列表 */
export const PRESET_TAGS = [
  '动漫',
  '写实',
  '插画',
  '油画',
  '水彩',
  '素描',
  '赛博朋克',
  '复古',
] as const

export type PresetTag = (typeof PRESET_TAGS)[number]
