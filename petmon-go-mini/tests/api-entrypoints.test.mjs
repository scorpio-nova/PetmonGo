import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pageFiles = [
  'src/pages/publish/index.vue',
  'src/pages/report-event/index.vue'
]

for (const relativePath of pageFiles) {
  const source = await readFile(path.join(root, relativePath), 'utf8')
  assert.equal(
    source.includes('wx.cloud.callFunction'),
    false,
    `${relativePath} must use src/api wrappers instead of calling wx.cloud.callFunction directly`
  )
}

const reportEvent = await readFile(path.join(root, 'src/pages/report-event/index.vue'), 'utf8')
assert.match(reportEvent, /import\s+\{\s*addEvent/)
const publish = await readFile(path.join(root, 'src/pages/publish/index.vue'), 'utf8')
assert.match(publish, /import\s+\{\s*login\s*\}/)

console.log('API entrypoint checks passed')
