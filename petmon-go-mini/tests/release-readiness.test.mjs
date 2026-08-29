import fs from 'node:fs'
import path from 'node:path'

const projectRoot = path.resolve(process.argv[2] || 'dist/build/mp-weixin')
const miniprogramRoot = fs.existsSync(path.join(projectRoot, 'miniprogram'))
  ? path.join(projectRoot, 'miniprogram')
  : projectRoot
const failures = []

function expect(condition, message) {
  if (!condition) failures.push(message)
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name)
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath]
  })
}

const appConfig = JSON.parse(fs.readFileSync(path.join(miniprogramRoot, 'app.json'), 'utf8'))
expect(appConfig.lazyCodeLoading === 'requiredComponents', 'app.json must enable requiredComponents lazy loading')
expect(appConfig.pages.includes('pages/inbox/index'), 'app.json must register the inbox page')
expect(appConfig.pages.includes('pages/report-event/index'), 'app.json must register the report-event page')

for (const iconName of ['cat.png', 'dog.png', 'c-cross-white.svg']) {
  expect(fs.existsSync(path.join(miniprogramRoot, 'static/icons', iconName)), `missing packaged icon: ${iconName}`)
}

const homeMarkup = fs.readFileSync(path.join(miniprogramRoot, 'pages/index/index.wxml'), 'utf8')
const assetManifest = fs.readFileSync(path.join(miniprogramRoot, 'common/assets.js'), 'utf8')
expect(homeMarkup.includes('publish-btn'), 'home page must render the central publish button')
expect(assetManifest.includes('c-cross-white.svg'), 'central publish button must use the white SVG plus icon')

for (const fontName of ['gaegu-300.woff2', 'gaegu-700.woff2', 'long-cang.woff2', 'OFL.txt']) {
  expect(fs.existsSync(path.join(miniprogramRoot, 'static/fonts', fontName)), `missing bundled font asset: ${fontName}`)
}

const mediaExtensions = new Set([
  '.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.flac', '.m4a', '.ogg', '.ape',
  '.amr', '.wma', '.wav', '.mp3', '.mp4', '.aac', '.aiff', '.caf'
])
const mediaBytes = listFiles(miniprogramRoot)
  .filter(file => mediaExtensions.has(path.extname(file).toLowerCase()))
  .reduce((total, file) => total + fs.statSync(file).size, 0)
expect(mediaBytes <= 200 * 1024, `image and audio resources total ${(mediaBytes / 1024).toFixed(1)} KiB; limit is 200 KiB`)

const projectConfigPath = path.join(projectRoot, 'project.config.json')
if (fs.existsSync(projectConfigPath)) {
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'))
  expect(projectConfig.setting?.minified === true, 'project.config.json must enable JS minification')
}

if (failures.length) {
  throw new Error(`release readiness checks failed:\n- ${failures.join('\n- ')}`)
}

console.log(`release readiness checks passed (${(mediaBytes / 1024).toFixed(1)} KiB media)`)
