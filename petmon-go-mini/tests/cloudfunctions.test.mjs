import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const Module = require('node:module')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function makeCollection(config = {}) {
  const state = { filters: [], skip: 0, limit: undefined, updates: [], adds: [] }
  const chain = {
    where(filter) {
      state.filters.push(filter)
      return chain
    },
    orderBy() { return chain },
    skip(value) { state.skip = value; return chain },
    limit(value) { state.limit = value; return chain },
    async count() {
      return { total: config.total ?? (config.data || []).length }
    },
    async get() {
      return { data: config.data || [] }
    },
    async add(payload) {
      state.adds.push(payload)
      if (config.add) return config.add(payload)
      return { _id: config.id || 'generated-id' }
    },
    async update(payload) {
      state.updates.push(payload)
      if (config.update) return config.update(payload)
      return { stats: { updated: 1 } }
    },
    doc(id) {
      return {
        async get() {
          if (config.docGet) return config.docGet(id)
          return { data: config.doc || {} }
        },
        async update(payload) {
          state.updates.push({ id, ...payload })
          return { stats: { updated: 1 } }
        }
      }
    },
    state
  }
  return chain
}

function makeSdk(options = {}) {
  const { collections = {}, msgErrCode = 0, imgErrCode = 0 } = options
  const openid = Object.prototype.hasOwnProperty.call(options, 'openid') ? options.openid : 'openid-test'
  const created = {}
  const db = {
    command: {
      inc(value) { return { __op: 'inc', value } },
      push(value) { return { __op: 'push', value } }
    },
    collection(name) {
      if (!created[name]) created[name] = makeCollection(collections[name])
      return created[name]
    }
  }
  const sdk = {
    DYNAMIC_CURRENT_ENV: 'test-env',
    init() {},
    database() { return db },
    getWXContext() { return { OPENID: openid } },
    uploadFile: async () => ({ fileID: 'cloud://test-file' }),
    openapi: {
      security: {
        msgSecCheck: async () => ({ errCode: msgErrCode }),
        imgSecCheck: async () => ({ errCode: imgErrCode })
      }
    },
    __collections: created
  }
  return sdk
}

async function loadMain(relativePath, sdk) {
  const file = path.join(root, relativePath, 'index.js')
  const originalLoad = Module._load
  try {
    Module._load = function (request, parent, isMain) {
      if (request === 'wx-server-sdk') return sdk
      return originalLoad.call(this, request, parent, isMain)
    }
    delete require.cache[require.resolve(file)]
    return require(file).main
  } finally {
    Module._load = originalLoad
  }
}

const tests = []
function test(name, fn) { tests.push({ name, fn }) }

test('login creates a new user for an unknown openid', async () => {
  const sdk = makeSdk({ collections: { users: { data: [], id: 'user-001' } } })
  const main = await loadMain('cloudfunctions/login', sdk)
  const result = await main({}, {})
  assert.equal(result.code, 0)
  assert.equal(result.data.isNewUser, true)
  assert.equal(result.data.userInfo._id, 'user-001')
  assert.equal(result.data.userInfo._openid, 'openid-test')
  assert.equal(sdk.__collections.users.state.adds.length, 1)
})

test('login returns an existing user without inserting another row', async () => {
  const existing = { _id: 'user-001', _openid: 'openid-test', feeds: 3 }
  const sdk = makeSdk({ collections: { users: { data: [existing] } } })
  const main = await loadMain('cloudfunctions/login', sdk)
  const result = await main({}, {})
  assert.equal(result.code, 0)
  assert.equal(result.data.isNewUser, false)
  assert.deepEqual(result.data.userInfo, existing)
  assert.equal(sdk.__collections.users.state.adds.length, 0)
})

test('getPets hides precise trace locations for guests', async () => {
  const sdk = makeSdk({ openid: undefined, collections: {
    pets: { data: [{ _id: 'p1', name: 'Mochi', photos: ['photo'], traces: [
      { timestamp: '2026-01-01', place: 'park', area: 'A', location: { type: 'Point', coordinates: [1, 2] } }
    ] }] }
  } })
  const main = await loadMain('cloudfunctions/getPets', sdk)
  const result = await main({ page: 1, pageSize: 20 }, {})
  assert.equal(result.code, 0)
  assert.equal(result.data.list[0].traces[0].location, undefined)
})

test('addPet uploads an optional photo and updates the owner counter', async () => {
  const sdk = makeSdk({ collections: {
    pets: { id: 'pet-001' },
    users: {}
  } })
  const main = await loadMain('cloudfunctions/addPet', sdk)
  const result = await main({ name: 'Mochi', kind: 'cat', breed: 'British Shorthair', tag: '友好', area: 'A', photo: 'aGVsbG8=' }, {})
  assert.equal(result.code, 0)
  assert.equal(result.data.petId, 'pet-001')
  const pet = sdk.__collections.pets.state.adds[0].data
  assert.equal(pet.photos[0], 'cloud://test-file')
  assert.equal(pet.seen, 1)
  assert.equal(sdk.__collections.users.state.updates.length, 1)
})

test('addPet rejects content that fails name review before inserting', async () => {
  const sdk = makeSdk({ msgErrCode: 87014, collections: { pets: {} } })
  const main = await loadMain('cloudfunctions/addPet', sdk)
  const result = await main({ name: '违规', kind: 'cat', breed: 'x', tag: 'x', area: 'A' }, {})
  assert.equal(result.code, -2)
  assert.equal(sdk.__collections.pets, undefined)
})

test('addEncounter creates an encounter and all related side effects', async () => {
  const sdk = makeSdk({ collections: {
    pets: { doc: { _id: 'p1', _openid: 'owner-1', name: 'Mochi', area: 'A', location: { type: 'Point', coordinates: [1, 2] } }, id: 'p1' },
    encounters: { id: 'enc-001' },
    users: {},
    notices: {}
  } })
  const main = await loadMain('cloudfunctions/addEncounter', sdk)
  const result = await main({ petId: 'p1', note: '在公园遇见' }, {})
  assert.equal(result.code, 0)
  assert.equal(result.data.encounterId, 'enc-001')
  assert.equal(sdk.__collections.encounters.state.adds.length, 1)
  assert.equal(sdk.__collections.pets.state.updates.length, 1)
  assert.equal(sdk.__collections.users.state.updates.length, 1)
  assert.equal(sdk.__collections.notices.state.adds.length, 1)
})

test('addEvent stops before writing when title review fails', async () => {
  const sdk = makeSdk({ msgErrCode: 87014, collections: { events: {} } })
  const main = await loadMain('cloudfunctions/addEvent', sdk)
  const result = await main({ type: '丢失', title: '违规', place: 'A' }, {})
  assert.equal(result.code, -2)
  assert.equal(sdk.__collections.events, undefined)
})

test('getNotifications returns the current user page in the declared envelope', async () => {
  const sdk = makeSdk({ collections: {
    notices: { data: [{ _id: 'n1', _openid: 'openid-test', createdAt: '2026-01-01' }], total: 1 }
  } })
  const main = await loadMain('cloudfunctions/getNotifications', sdk)
  const result = await main({ page: 2, pageSize: 5 }, {})
  assert.equal(result.code, 0)
  assert.deepEqual(result.data, {
    list: [{ _id: 'n1', _openid: 'openid-test', createdAt: '2026-01-01' }],
    total: 1,
    page: 2,
    pageSize: 5
  })
})

let failures = 0
for (const item of tests) {
  try {
    await item.fn()
    console.log(`ok - ${item.name}`)
  } catch (error) {
    failures += 1
    console.error(`not ok - ${item.name}`)
    console.error(error)
  }
}

if (failures) process.exitCode = 1
else console.log(`\n${tests.length} cloud function tests passed`)
