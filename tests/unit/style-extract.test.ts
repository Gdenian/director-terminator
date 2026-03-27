import type { Job } from 'bullmq'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

const prismaMock = vi.hoisted(() => ({
  userStyle: {
    update: vi.fn(async () => ({})),
  },
}))

const visionMock = vi.hoisted(() => ({
  chatCompletionWithVision: vi.fn(async () => ({
    choices: [{ message: { content: 'mocked style description' } }],
  })),
}))

const storageMock = vi.hoisted(() => ({
  toFetchableUrl: vi.fn((url: string) => `https://fetchable.example/${url}`),
}))

const loggingMock = vi.hoisted(() => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/llm/vision', () => ({ chatCompletionWithVision: visionMock.chatCompletionWithVision }))
vi.mock('@/lib/storage', () => ({ toFetchableUrl: storageMock.toFetchableUrl }))
vi.mock('@/lib/logging/core', () => loggingMock)

import { handleStyleExtractTask } from '@/lib/workers/handlers/style-extract-task-handler'

function buildJob(payload: Record<string, unknown>): Job<TaskJobData> {
  return {
    data: {
      taskId: 'task-style-extract-1',
      type: TASK_TYPE.STYLE_EXTRACT,
      locale: 'zh',
      projectId: 'user-style',
      episodeId: null,
      targetType: 'user-style',
      targetId: 'style-1',
      payload,
      userId: 'user-1',
    },
  } as unknown as Job<TaskJobData>
}

describe('handleStyleExtractTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功提取风格描述并更新数据库', async () => {
    visionMock.chatCompletionWithVision
      .mockResolvedValueOnce({
        choices: [{ message: { content: '线条细腻，上色采用平涂风格，光影对比强烈' } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Fine lines, flat coloring style, strong light contrast' } }],
      })

    const job = buildJob({
      styleId: 'style-1',
      referenceImageUrl: 'user-styles/user-1/style-1/ref.jpg',
      analysisModel: 'gpt-4o',
    })

    const result = await handleStyleExtractTask(job)

    expect(result).toEqual({
      success: true,
      promptZh: '线条细腻，上色采用平涂风格，光影对比强烈',
      promptEn: 'Fine lines, flat coloring style, strong light contrast',
    })

    // 验证调用了两次 Vision API (中文 + 英文)
    expect(visionMock.chatCompletionWithVision).toHaveBeenCalledTimes(2)

    // 验证数据库更新
    expect(prismaMock.userStyle.update).toHaveBeenCalledWith({
      where: { id: 'style-1' },
      data: {
        promptZh: '线条细腻，上色采用平涂风格，光影对比强烈',
        promptEn: 'Fine lines, flat coloring style, strong light contrast',
        extractionStatus: 'completed',
        extractionMessage: null,
      },
    })
  })

  it('使用 analysisModel 作为 LLM 模型', async () => {
    visionMock.chatCompletionWithVision.mockResolvedValue({
      choices: [{ message: { content: 'style desc' } }],
    })

    const job = buildJob({
      styleId: 'style-2',
      referenceImageUrl: 'user-styles/user-1/style-2/ref.jpg',
      analysisModel: 'gemini-1.5-pro',
    })

    await handleStyleExtractTask(job)

    // 验证使用了指定的模型
    expect(visionMock.chatCompletionWithVision).toHaveBeenCalledWith(
      'user-1',
      'gemini-1.5-pro',
      expect.any(String),
      expect.any(Array),
    )
  })

  it('analysisModel 为 null 时传递 null 给 Vision API', async () => {
    visionMock.chatCompletionWithVision.mockResolvedValue({
      choices: [{ message: { content: 'style desc' } }],
    })

    const job = buildJob({
      styleId: 'style-3',
      referenceImageUrl: 'user-styles/user-1/style-3/ref.jpg',
      analysisModel: null,
    })

    await handleStyleExtractTask(job)

    expect(visionMock.chatCompletionWithVision).toHaveBeenCalledWith(
      'user-1',
      null,
      expect.any(String),
      expect.any(Array),
    )
  })

  it('payload 缺失时抛出错误', async () => {
    const job = buildJob(null as unknown as Record<string, unknown>)

    await expect(handleStyleExtractTask(job)).rejects.toThrow('Style extract task requires payload')
  })

  it('Vision API 失败时更新状态为 failed 并抛出错误', async () => {
    const originalError = new Error('Vision API rate limit exceeded')
    visionMock.chatCompletionWithVision.mockRejectedValue(originalError)

    const job = buildJob({
      styleId: 'style-4',
      referenceImageUrl: 'user-styles/user-1/style-4/ref.jpg',
      analysisModel: null,
    })

    await expect(handleStyleExtractTask(job)).rejects.toThrow('Vision API rate limit exceeded')

    // 验证状态更新为 failed
    expect(prismaMock.userStyle.update).toHaveBeenCalledWith({
      where: { id: 'style-4' },
      data: {
        extractionStatus: 'failed',
        extractionMessage: 'Vision API rate limit exceeded',
      },
    })

    // 验证记录了错误日志
    expect(loggingMock.logError).toHaveBeenCalled()
  })

  it('转换 referenceImageUrl 为可访问 URL', async () => {
    visionMock.chatCompletionWithVision.mockResolvedValue({
      choices: [{ message: { content: 'style desc' } }],
    })

    const job = buildJob({
      styleId: 'style-5',
      referenceImageUrl: 'user-styles/user-1/style-5/ref.jpg',
      analysisModel: null,
    })

    await handleStyleExtractTask(job)

    expect(storageMock.toFetchableUrl).toHaveBeenCalledWith('user-styles/user-1/style-5/ref.jpg')
  })
})
