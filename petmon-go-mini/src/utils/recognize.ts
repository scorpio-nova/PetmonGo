export interface MediaSelectionResult {
  tempFilePaths?: string[]
  tempFiles?: Array<{ tempFilePath?: string }>
}
export function normalizeMediaPath(result: MediaSelectionResult): string {
  return result.tempFilePaths?.[0] || result.tempFiles?.[0]?.tempFilePath || ''
}

export function getRecognitionErrorMessage(error: unknown): string {
  const message = typeof error === 'object' && error && 'errMsg' in error
    ? String((error as { errMsg?: unknown }).errMsg || '')
    : error instanceof Error ? error.message : String(error || '')
  const lower = message.toLowerCase()
  if (lower.includes('cancel')) return '已取消选图'
  if (lower.includes('auth') || lower.includes('permission') || lower.includes('deny')) {
    return '没有相机或相册权限，请在微信设置中开启后重试'
  }
  return '照片选择失败，请重试'
}
