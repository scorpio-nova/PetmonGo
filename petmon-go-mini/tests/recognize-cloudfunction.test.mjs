import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const Module = require('node:module')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const http = require('node:http')
const requests = []
const deleted = []
const db = {
  collection(name) {
    assert.equal(name, 'pets')
    return {
      limit(value) {
        assert.equal(value, 100)
        return this
      },
      async get() {
        return {
          data: [{
            _id: 'pet-001',
            name: 'Mochi',
            cnName: '小萌萌',
            photos: ['cloud://pets/pet-001.jpg']
          }]
        }
      }
    }
  }
}
const sdk = {
  DYNAMIC_CURRENT_ENV: 'test-env',
  init() {},
  database() { return db },
  getWXContext() { return { OPENID: 'openid-test' } },
  async getTempFileURL({ fileList }) {
    return {
      fileList: fileList.map(fileID => ({
        fileID,
        status: 0,
        tempFileURL: `https://assets.example/${encodeURIComponent(fileID)}`
      }))
    }
  },
  async deleteFile({ fileList }) { deleted.push(...fileList) }
}

const originalLoad = Module._load
const originalHttpRequest = http.request
http.request = (url, options, callback) => {
  const request = new EventEmitter()
  request.write = body => {
    requests.push({
      method: options.method,
      body: JSON.parse(body),
      token: options.headers['x-clip-service-token']
    })
  }
  request.end = () => {
    const response = new EventEmitter()
    response.statusCode = 200
    response.setEncoding = () => {}
    callback(response)
    process.nextTick(() => {
      response.emit('data', JSON.stringify({
        model: 'clip-test',
        matches: [
          { petId: 'pet-001', score: 0.93 },
          { petId: 'not-in-gallery', score: 0.99 }
        ]
      }))
      response.emit('end')
    })
  }
  request.destroy = error => request.emit('error', error)
  return request
}
let main
try {
  Module._load = function (request, parent, isMain) {
    if (request === 'wx-server-sdk') return sdk
    return originalLoad.call(this, request, parent, isMain)
  }
  const functionPath = path.join(root, 'cloudfunctions/recognizePet/index.js')
  delete require.cache[require.resolve(functionPath)]
  main = require(functionPath).main
} finally {
  Module._load = originalLoad
}

const previousEndpoint = process.env.CLIP_INFERENCE_URL
const previousToken = process.env.CLIP_INFERENCE_TOKEN
process.env.CLIP_INFERENCE_URL = 'http://clip-service.test/v1/clip/match'
process.env.CLIP_INFERENCE_TOKEN = 'test-token'

try {
  const result = await main({ fileId: 'cloud://recognitions/input.jpg' })
  assert.deepEqual(result, {
    code: 0,
    data: {
      model: 'clip-test',
      matches: [{
        petId: 'pet-001',
        score: 0.93,
        name: 'Mochi',
        cnName: '小萌萌',
        photo: 'https://assets.example/cloud%3A%2F%2Fpets%2Fpet-001.jpg'
      }]
    }
  })
  assert.equal(requests.length, 1)
  assert.equal(requests[0].method, 'POST')
  assert.equal(requests[0].token, 'test-token')
  assert.equal(requests[0].body.candidates.length, 1)
  assert.match(requests[0].body.imageUrl, /recognitions/)
  assert.deepEqual(deleted, ['cloud://recognitions/input.jpg'])

  delete process.env.CLIP_INFERENCE_URL
  const missingService = await main({ fileId: 'cloud://recognitions/unconfigured.jpg' })
  assert.deepEqual(missingService, { code: -503, message: '识别服务尚未配置' })
  assert.deepEqual(deleted, ['cloud://recognitions/input.jpg', 'cloud://recognitions/unconfigured.jpg'])
} finally {
  if (previousEndpoint === undefined) delete process.env.CLIP_INFERENCE_URL
  else process.env.CLIP_INFERENCE_URL = previousEndpoint
  if (previousToken === undefined) delete process.env.CLIP_INFERENCE_TOKEN
  else process.env.CLIP_INFERENCE_TOKEN = previousToken
  http.request = originalHttpRequest
}

console.log('recognizePet cloud function contract passed')
