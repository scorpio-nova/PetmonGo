import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const config = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'))

if (config.compileType !== 'miniprogram') {
  throw new Error('project.config.json must remain a mini-program project')
}

if (config.miniprogramRoot !== 'dist/build/mp-weixin/') {
  throw new Error('project.config.json must point miniprogramRoot to dist/build/mp-weixin/')
}

const appJsonPath = path.join(root, config.miniprogramRoot, 'app.json')
if (!fs.existsSync(appJsonPath)) {
  throw new Error(`compiled app.json missing at ${appJsonPath}`)
}

const app = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
if (!app.pages?.includes('pages/index/index')) {
  throw new Error('compiled app.json must include the home page')
}

console.log('wechat devtools config checks passed')
