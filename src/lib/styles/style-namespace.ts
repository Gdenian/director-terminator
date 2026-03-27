/**
 * 风格命名空间工具函数
 *
 * 自定义风格标识符格式：user:{uuid}
 * 系统预设标识符：裸字符串，如 "american-comic"
 *
 * 用途：统一判断风格标识符类型，避免各处重复编写判断逻辑
 */

/** 判断风格标识符是否为用户自定义风格（以 "user:" 前缀开头） */
export function isUserStyle(artStyle: string): boolean {
  return artStyle.startsWith('user:')
}

/**
 * 从用户风格标识符中提取 UserStyle ID
 * 仅在 isUserStyle() 返回 true 时调用
 */
export function extractUserStyleId(artStyle: string): string {
  return artStyle.slice('user:'.length)
}

/** 将 UserStyle ID 转换为完整的风格标识符 */
export function toUserStyleIdentifier(styleId: string): string {
  return `user:${styleId}`
}
