export interface CachedResource {
  version: string
  path: string
}

export interface RemoteResourceOptions {
  key: string
  version: string
  fileId?: string
  fallback: string
}

interface TempFileResult {
  tempFileURL?: string
  status?: number
}

interface DownloadResult {
  statusCode?: number
  tempFilePath?: string
}

const CACHE_PREFIX = 'petmon.resource.'

function cacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`
}

function readCache(key: string, version: string): string | null {
  const cached = uni.getStorageSync(cacheKey(key)) as CachedResource | undefined
  if (!cached || cached.version !== version || !cached.path) return null
  return cached.path
}

function writeCache(key: string, version: string, filePath: string): void {
  uni.setStorageSync(cacheKey(key), { version, path: filePath } satisfies CachedResource)
}

function getTempUrl(fileId: string): Promise<string | null> {
  if (/^https?:\/\//i.test(fileId)) return Promise.resolve(fileId)
  if (typeof wx === 'undefined' || !wx.cloud?.getTempFileURL) return Promise.resolve(null)

  return new Promise(resolve => {
    wx.cloud.getTempFileURL({
      fileList: [fileId],
      success: (result: { fileList?: TempFileResult[] }) => {
        const item = result.fileList?.[0]
        resolve(item?.status === 0 || item?.status === undefined ? item?.tempFileURL || null : null)
      },
      fail: () => resolve(null)
    })
  })
}

function download(url: string): Promise<string | null> {
  if (typeof wx === 'undefined' || !wx.downloadFile) return Promise.resolve(null)

  return new Promise(resolve => {
    wx.downloadFile({
      url,
      success: (result: DownloadResult) => {
        const statusCode = result.statusCode ?? 200
        resolve(statusCode >= 200 && statusCode < 300 ? result.tempFilePath || null : null)
      },
      fail: () => resolve(null)
    })
  })
}

function saveDownloadedFile(tempFilePath: string): Promise<string> {
  if (typeof wx === 'undefined' || !wx.saveFile) return Promise.resolve(tempFilePath)

  return new Promise(resolve => {
    wx.saveFile({
      tempFilePath,
      success: (result: { savedFilePath?: string }) => resolve(result.savedFilePath || tempFilePath),
      fail: () => resolve(tempFilePath)
    })
  })
}

/** Resolve a remote resource, preferring a versioned local cache and falling back safely. */
export async function resolveRemoteResource(options: RemoteResourceOptions): Promise<string> {
  const cachedPath = readCache(options.key, options.version)
  if (cachedPath) return cachedPath
  if (!options.fileId) return options.fallback

  const url = await getTempUrl(options.fileId)
  if (!url) return options.fallback

  const tempPath = await download(url)
  if (!tempPath) return options.fallback

  const savedPath = await saveDownloadedFile(tempPath)
  writeCache(options.key, options.version, savedPath)
  return savedPath
}

export function clearResourceCache(key: string): void {
  uni.removeStorageSync(cacheKey(key))
}

export function getResourceCacheKey(key: string): string {
  return cacheKey(key)
}
