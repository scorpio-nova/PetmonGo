import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const sourceRoot = path.resolve(new URL('../src/', import.meta.url).pathname)
const outputRoot = await mkdtemp(path.join(os.tmpdir(), 'petmon-api-runtime-'))

async function compile(relativePath) {
  const sourcePath = path.join(sourceRoot, relativePath)
  const source = await readFile(sourcePath, 'utf8')
  let output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      sourceMap: false
    },
    fileName: sourcePath
  }).outputText

  // The app uses the Vite alias at runtime. Rewrite it for this isolated Node test output.
  output = output.replaceAll('require("@/utils/cloud")', 'require("../utils/cloud")')
  const outputPath = path.join(outputRoot, relativePath.replace(/\.ts$/, '.js'))
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, output)
  return outputPath
}

await compile('utils/cloud.ts')
for (const apiFile of ['user.ts', 'pet.ts', 'encounter.ts', 'event.ts', 'notice.ts']) {
  await compile(`api/${apiFile}`)
}

const calls = []
const storage = new Map()
globalThis.uni = {
  getStorageSync(key) { return storage.get(key) },
  setStorageSync(key, value) { storage.set(key, value) },
  removeStorageSync(key) { storage.delete(key) }
}
globalThis.wx = { cloud: undefined }

const cloud = require(path.join(outputRoot, 'utils/cloud.js'))
const userApi = require(path.join(outputRoot, 'api/user.js'))
const petApi = require(path.join(outputRoot, 'api/pet.js'))
const encounterApi = require(path.join(outputRoot, 'api/encounter.js'))
const eventApi = require(path.join(outputRoot, 'api/event.js'))
const noticeApi = require(path.join(outputRoot, 'api/notice.js'))

assert.deepEqual(await cloud.callCloud('login'), { code: -1, message: '云开发未初始化' })

wx.cloud = {
  async callFunction(payload) {
    calls.push(payload)
    if (payload.name === 'failure') throw new Error('network down')
    return { result: { code: 0, data: { ok: true } } }
  }
}
assert.deepEqual(await cloud.callCloud('health', { ping: true }), { code: 0, data: { ok: true } })
assert.deepEqual(await cloud.callCloud('failure'), { code: -1, message: 'network down' })

wx.cloud = {
  async callFunction(payload) {
    calls.push(payload)
    const results = {
      login: { code: 0, data: { userInfo: { _id: 'u1' }, isNewUser: true } },
      getPets: { code: 0, data: { list: [], total: 0, page: 2, pageSize: 5 } },
      addPet: { code: 0, data: { petId: 'p1' } },
      addEncounter: { code: 0, data: { encounterId: 'e1' } },
      addEvent: { code: 0, data: { eventId: 'event1' } },
      getNotifications: { code: 0, data: { list: [], total: 0, page: 2, pageSize: 5 } }
    }
    return { result: results[payload.name] || { code: -2, message: 'rejected' } }
  }
}

const loginResult = await userApi.login()
assert.deepEqual(loginResult, { userInfo: { _id: 'u1' }, isNewUser: true })
assert.deepEqual(storage.get('userInfo'), { _id: 'u1' })
assert.deepEqual(await petApi.getPets({ area: 'A', page: 2, pageSize: 5 }), { list: [], total: 0, page: 2, pageSize: 5 })
assert.equal(await petApi.addPet({ name: 'Mochi', kind: 'cat', breed: 'x', tag: 'x', area: 'A' }), 'p1')
assert.equal(await encounterApi.addEncounter({ petId: 'p1' }), 'e1')
assert.equal(await eventApi.addEvent({ type: '丢失', title: '走失', place: 'A' }), 'event1')
assert.deepEqual(await noticeApi.getNotifications({ page: 2, pageSize: 5 }), { list: [], total: 0, page: 2, pageSize: 5 })

assert.deepEqual(
  calls.slice(-6).map(call => ({ name: call.name, data: call.data })),
  [
    { name: 'login', data: undefined },
    { name: 'getPets', data: { area: 'A', page: 2, pageSize: 5 } },
    { name: 'addPet', data: { name: 'Mochi', kind: 'cat', breed: 'x', tag: 'x', area: 'A' } },
    { name: 'addEncounter', data: { petId: 'p1' } },
    { name: 'addEvent', data: { type: '丢失', title: '走失', place: 'A' } },
    { name: 'getNotifications', data: { page: 2, pageSize: 5 } }
  ]
)

wx.cloud.callFunction = async () => ({ result: { code: -2, message: 'rejected' } })
assert.equal(await petApi.addPet({ name: 'Mochi', kind: 'cat', breed: 'x', tag: 'x', area: 'A' }), null)
assert.equal(await encounterApi.addEncounter({ petId: 'missing' }), null)
assert.equal(await eventApi.addEvent({ type: '丢失', title: 'x', place: 'A' }), null)
assert.equal(await noticeApi.getNotifications(), null)

console.log('client API runtime checks passed')
