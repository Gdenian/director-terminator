/**
 * 风格提取 Worker Handler
 * 从参考图中提取风格描述
 *
 * 流程：
 * 1. 获取可访问的图片 URL
 * 2. 调用 LLM Vision 提取中文描述
 * 3. 调用 LLM Vision 提取英文描述
 * 4. 更新风格记录
 * 5. 失败时更新状态为 failed
 */

import { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { chatCompletionWithVision } from '@/lib/llm/vision'
import { toFetchableUrl } from '@/lib/storage'
import { logInfo, logError } from '@/lib/logging/core'
import { type TaskJobData } from '@/lib/task/types'

const STYLE_EXTRACT_PROMPT_ZH = `请分析这张图片的视觉风格特征，描述以下方面（不要描述图片内容）：

1. 线条风格：粗细、硬度、连续性
2. 上色方式：平涂、渐变、赛璐璐、厚涂等
3. 光影处理：对比度、光源方向、阴影风格
4. 构图特点：视角、透视、空间感
5. 整体氛围：写实、卡通、动漫、油画等

请用中文输出一段 50-100 字的风格描述。`

const STYLE_EXTRACT_PROMPT_EN = `Analyze the visual style characteristics of this image. Describe (do NOT describe the image content):

1. Line style: thickness, hardness, continuity
2. Coloring method: flat, gradient, cel-shading, impasto, etc.
3. Lighting: contrast, light direction, shadow style
4. Composition: angle, perspective, spatial sense
5. Overall atmosphere: realistic, cartoon, anime, oil painting, etc.

Output a 50-100 word style description in English.`

interface StyleExtractPayload {
  styleId: string
  referenceImageUrl: string
  analysisModel: string | null
}

export async function handleStyleExtractTask(job: Job<TaskJobData>) {
  const { userId, payload } = job.data
  if (!payload) {
    throw new Error('Style extract task requires payload')
  }
  const data = payload as unknown as StyleExtractPayload
  const { styleId, referenceImageUrl, analysisModel } = data

  logInfo('[style-extract]', `开始提取风格 ${styleId}`, {
    userId,
    referenceImageUrl,
  })

  try {
    // 1. 获取可访问的图片 URL
    const imageUrl = toFetchableUrl(referenceImageUrl)

    // 2. 调用 LLM Vision 提取中文描述
    const zhCompletion = await chatCompletionWithVision(
      userId,
      analysisModel,
      STYLE_EXTRACT_PROMPT_ZH,
      [imageUrl],
    )
    const promptZh = zhCompletion.choices[0]?.message?.content?.trim() || ''

    // 3. 调用 LLM Vision 提取英文描述
    const enCompletion = await chatCompletionWithVision(
      userId,
      analysisModel,
      STYLE_EXTRACT_PROMPT_EN,
      [imageUrl],
    )
    const promptEn = enCompletion.choices[0]?.message?.content?.trim() || ''

    // 4. 更新风格记录
    await prisma.userStyle.update({
      where: { id: styleId },
      data: {
        promptZh,
        promptEn,
        extractionStatus: 'completed',
        extractionMessage: null,
      },
    })

    logInfo('[style-extract]', `风格提取完成 ${styleId}`, {
      promptZhLength: promptZh.length,
      promptEnLength: promptEn.length,
    })

    return { success: true, promptZh, promptEn }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '提取失败'

    // 更新状态为失败
    await prisma.userStyle.update({
      where: { id: styleId },
      data: {
        extractionStatus: 'failed',
        extractionMessage: errorMessage,
      },
    })

    logError('[style-extract]', `风格提取失败 ${styleId}`, { error: errorMessage })
    throw error
  }
}
