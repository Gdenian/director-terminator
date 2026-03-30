/**
 * 客户端安全的 storage 工具函数
 * 完全独立 - 不导入任何 Node.js 依赖
 */

/**
 * 将内部存储 URL 转换为可访问的 URL
 * 客户端版本：使用 API 代理端点
 */
export function toFetchableUrl(inputUrl: string): string {
  // 如果已经是完整 URL，直接返回
  if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
    return inputUrl
  }

  // 内部存储路径，使用 API 代理
  return `/api/files/${encodeURIComponent(inputUrl)}`
}
