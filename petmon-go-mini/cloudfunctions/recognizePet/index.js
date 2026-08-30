// 云函数：recognizePet
// 功能：上传图片由后端 CLIP 推理服务完成宠物匹配。
//
// 云函数只负责鉴权、临时 URL 和候选宠物整理，不在函数包内加载模型。

const http = require('http')
const https = require('https')
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const MAX_CANDIDATES = 100
const TOP_K = 3

function requestJson(endpoint, payload, token) {
  return new Promise((resolve, reject) => {
    let url
    try {
      url = new URL(endpoint)
    } catch {
      reject(new Error('CLIP_INFERENCE_URL 配置无效'))
      return
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      reject(new Error('CLIP_INFERENCE_URL 必须使用 HTTP(S)'))
      return
    }

    const body = JSON.stringify(payload)
    const transport = url.protocol === 'https:' ? https : http
    const request = transport.request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        ...(token ? { 'x-clip-service-token': token } : {})
      },
      timeout: 20000
    }, response => {
      let raw = ''
      response.setEncoding('utf8')
      response.on('data', chunk => { raw += chunk })
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`CLIP service returned HTTP ${response.statusCode}`))
          return
        }
        try {
          resolve(JSON.parse(raw))
        } catch {
          reject(new Error('CLIP service returned invalid JSON'))
        }
      })
    })
    request.on('timeout', () => request.destroy(new Error('CLIP service timeout')))
    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

async function getTemporaryUrls(fileIds) {
  if (!fileIds.length) return new Map()
  if (!cloud.getTempFileURL) return new Map()
  const result = await cloud.getTempFileURL({ fileList: fileIds })
  return new Map((result.fileList || [])
    .filter(item => item.status === 0 && item.tempFileURL)
    .map(item => [item.fileID, item.tempFileURL]))
}

async function cleanupUpload(fileId) {
  if (!fileId || !cloud.deleteFile || !fileId.startsWith('cloud://')) return
  try {
    await cloud.deleteFile({ fileList: [fileId] })
  } catch (err) {
    console.warn('recognizePet cleanup failed:', err.message)
  }
}

exports.main = async (event) => {
  const { fileId } = event || {}
  if (typeof fileId !== 'string' || !fileId.trim() || !fileId.startsWith('cloud://')) {
    return { code: -3, message: '缺少待识别图片' }
  }

  const endpoint = process.env.CLIP_INFERENCE_URL
  if (!endpoint) {
    await cleanupUpload(fileId)
    return { code: -503, message: '识别服务尚未配置' }
  }

  try {
    const inputUrls = await getTemporaryUrls([fileId])
    const imageUrl = inputUrls.get(fileId)
    if (!imageUrl) return { code: -404, message: '图片临时链接不可用' }

    const petsRes = await db.collection('pets').limit(MAX_CANDIDATES).get()
    const pets = (petsRes.data || []).filter(pet => pet._id && pet.photos && pet.photos[0])
    const galleryRefs = pets.map(pet => pet.photos[0])
    const galleryFileIds = galleryRefs.filter(ref => !/^https?:\/\//i.test(ref))
    const galleryUrls = await getTemporaryUrls(galleryFileIds)
    const candidates = pets.map(pet => ({
      petId: pet._id,
      name: pet.name || '',
      cnName: pet.cnName || '',
      imageRef: pet.photos[0],
      imageUrl: /^https?:\/\//i.test(pet.photos[0]) ? pet.photos[0] : galleryUrls.get(pet.photos[0])
    })).filter(candidate => candidate.imageUrl)

    if (!candidates.length) {
      return { code: -404, message: '暂无可用于匹配的宠物图库' }
    }

    const serviceResult = await requestJson(endpoint, {
      imageUrl,
      candidates: candidates.map(candidate => ({
        petId: candidate.petId,
        imageRef: candidate.imageRef,
        imageUrl: candidate.imageUrl
      })),
      topK: TOP_K
    }, process.env.CLIP_INFERENCE_TOKEN)

    const serviceMatches = Array.isArray(serviceResult.matches) ? serviceResult.matches : []
    const candidateById = new Map(candidates.map(candidate => [candidate.petId, candidate]))
    const matches = serviceMatches
      .filter(match => candidateById.has(match.petId) && Number.isFinite(Number(match.score)))
      .slice(0, TOP_K)
      .map(match => {
        const candidate = candidateById.get(match.petId)
        return {
          petId: match.petId,
          score: Number(match.score),
          name: candidate.name,
          cnName: candidate.cnName,
          photo: candidate.imageUrl
        }
      })

    return {
      code: 0,
      data: {
        model: serviceResult.model || 'clip',
        matches
      }
    }
  } catch (err) {
    console.error('recognizePet error:', err)
    return { code: -1, message: '识别服务暂时不可用' }
  } finally {
    await cleanupUpload(fileId)
  }
}
