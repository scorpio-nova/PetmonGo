import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = await readFile(new URL('../src/utils/resource-cache.ts', import.meta.url), 'utf8')
const outputRoot = await mkdtemp(path.join(os.tmpdir(), 'petmon-resource-cache-'))
const outputPath = path.join(outputRoot, 'resource-cache.cjs')
await writeFile(outputPath, ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  fileName: 'resource-cache.ts'
}).outputText)

const storage = new Map()
const calls = []
globalThis.uni = {
  getStorageSync(key) { return storage.get(key) },
  setStorageSync(key, value) { storage.set(key, value) },
  removeStorageSync(key) { storage.delete(key) }
}
globalThis.wx = {
  cloud: {
    getTempFileURL({ fileList, success }) {
      calls.push(['temp-url', fileList])
      success({ fileList: [{ status: 0, tempFileURL: 'https://cdn.example/pet.jpg' }] })
    }
  },
  downloadFile({ url, success }) {
    calls.push(['download', url])
    success({ statusCode: 200, tempFilePath: '/tmp/pet-download.jpg' })
  },
  saveFile({ tempFilePath, success }) {
    calls.push(['save', tempFilePath])
    success({ savedFilePath: '/wxfile/pet-cache.jpg' })
  }
}

const { resolveRemoteResource, clearResourceCache, getResourceCacheKey } = require(outputPath)

assert.equal(
  await resolveRemoteResource({ key: 'pet-photo:cat1', version: 'v1', fallback: '/static/pets/catt-1.jpg' }),
  '/static/pets/catt-1.jpg',
  'a resource without a remote fileId must use the packaged fallback'
)

const options = {
  key: 'pet-photo:cat1',
  version: 'v1',
  fileId: 'cloud://petmon-test/cat1.jpg',
  fallback: '/static/pets/catt-1.jpg'
}
assert.equal(await resolveRemoteResource(options), '/wxfile/pet-cache.jpg')
assert.deepEqual(calls, [
  ['temp-url', ['cloud://petmon-test/cat1.jpg']],
  ['download', 'https://cdn.example/pet.jpg'],
  ['save', '/tmp/pet-download.jpg']
])
assert.deepEqual(storage.get(getResourceCacheKey(options.key)), {
  version: 'v1',
  path: '/wxfile/pet-cache.jpg'
})

calls.length = 0
assert.equal(await resolveRemoteResource(options), '/wxfile/pet-cache.jpg')
assert.deepEqual(calls, [], 'a valid versioned cache entry must avoid network calls')

assert.equal(await resolveRemoteResource({ ...options, version: 'v2' }), '/wxfile/pet-cache.jpg')
assert.equal(calls.length, 3, 'a version change must refresh the remote resource')

clearResourceCache(options.key)
assert.equal(storage.has(getResourceCacheKey(options.key)), false)

wx.cloud.getTempFileURL = ({ fail }) => fail(new Error('expired'))
assert.equal(await resolveRemoteResource(options), options.fallback)

wx.cloud.getTempFileURL = ({ success }) => success({ fileList: [{ status: 0, tempFileURL: 'https://cdn.example/pet.jpg' }] })
wx.downloadFile = ({ success }) => success({ statusCode: 500 })
assert.equal(await resolveRemoteResource({ ...options, version: 'v3' }), options.fallback)

console.log('resource cache checks passed')
