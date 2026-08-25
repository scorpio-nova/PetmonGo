import assert from 'node:assert/strict'
import { access, chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(testDir, '../..')
const uploadScript = path.join(repoRoot, '.github/scripts/upload-miniprogram.sh')
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'petmongo-ci-upload-'))
const binDir = path.join(tempDir, 'bin')
const runnerTemp = path.join(tempDir, 'runner')
const argsLog = path.join(tempDir, 'npx-args.txt')
const keySnapshot = path.join(tempDir, 'private-key-snapshot.txt')

await mkdir(binDir)
await mkdir(runnerTemp)

const fakeNpx = path.join(binDir, 'npx')
await writeFile(
  fakeNpx,
  `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$@" > "$CI_UPLOAD_ARGS_LOG"
key_path=""
previous=""
for argument in "$@"; do
  if [[ "$previous" == "--private-key-path" ]]; then
    key_path="$argument"
  fi
  previous="$argument"
done
test -n "$key_path"
cp "$key_path" "$CI_UPLOAD_KEY_SNAPSHOT"
`,
)
await chmod(fakeNpx, 0o755)

const privateKey = '-----BEGIN PRIVATE KEY-----\ntest-key-material\n-----END PRIVATE KEY-----\n'
const result = spawnSync('bash', [uploadScript], {
  cwd: repoRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    PATH: `${binDir}:${process.env.PATH}`,
    RUNNER_TEMP: runnerTemp,
    GITHUB_RUN_NUMBER: '42',
    MINI_PROGRAM_APPID: 'wx-test-appid',
    MINI_PROGRAM_PRIVATE_KEY: privateKey,
    CI_UPLOAD_ARGS_LOG: argsLog,
    CI_UPLOAD_KEY_SNAPSHOT: keySnapshot,
  },
})

assert.equal(result.status, 0, `upload script failed:\n${result.stdout}\n${result.stderr}`)
assert.equal(result.stdout.includes('test-key-material'), false, 'private key leaked to stdout')
assert.equal(result.stderr.includes('test-key-material'), false, 'private key leaked to stderr')

const args = (await readFile(argsLog, 'utf8')).trimEnd().split('\n')
const expectedArgs = [
  '--yes',
  'miniprogram-ci@2.1.31',
  'upload',
  '--appid',
  'wx-test-appid',
  '--project-path',
  'petmon-go-mini/dist/build/mp-weixin',
  '--private-key-path',
  path.join(runnerTemp, 'miniprogram-ci-private.key'),
  '--upload-version',
  '0.1.42',
  '--upload-description',
  'Auto deploy from develop branch',
  '--robot',
  '1',
  '--use-project-config',
  'true',
]
assert.deepEqual(args, expectedArgs)
assert.equal(await readFile(keySnapshot, 'utf8'), privateKey)

const privateKeyPath = path.join(runnerTemp, 'miniprogram-ci-private.key')
await assert.rejects(access(privateKeyPath), { code: 'ENOENT' })

console.log('CI upload contract verified')
