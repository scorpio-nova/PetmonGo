// 宠物识别 API

import { callCloud } from '@/utils/cloud'

export interface RecognitionMatch {
  petId: string
  score: number
  name?: string
  cnName?: string
  photo?: string
}

export interface RecognitionResult {
  model: string
  matches: RecognitionMatch[]
}

interface UploadResult {
  fileID?: string
}

function uploadRecognitionPhoto(filePath: string): Promise<string | null> {
  if (typeof wx === 'undefined' || !wx.cloud?.uploadFile) return Promise.resolve(null)

  return new Promise(resolve => {
    wx.cloud.uploadFile({
      cloudPath: `recognitions/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`,
      filePath,
      success: (result: UploadResult) => resolve(result.fileID || null),
      fail: () => resolve(null)
    })
  })
}

/** Upload a selected local image and ask the backend CLIP service for matches. */
export async function recognizePet(filePath: string): Promise<RecognitionResult | null> {
  const fileId = await uploadRecognitionPhoto(filePath)
  if (!fileId) return null

  const result = await callCloud<RecognitionResult>('recognizePet', { fileId })
  if (result.code === 0 && result.data) return result.data
  return null
}
