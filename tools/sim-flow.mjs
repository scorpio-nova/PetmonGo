// 模拟用户链条:打开 app → 发布 tab → 拍照识别 → 点击图片槽 → 选文件。
// 用法: node sim-flow.mjs <url>   (url 可为 http://... 或 file://...)
import { chromium } from 'playwright-core';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
if (!url) { console.error('usage: node sim-flow.mjs <url>'); process.exit(1); }

// 本机已有的 headless shell
const exe = process.env.PW_EXE ||
  '/Users/serena/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-mac/headless_shell';

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

page.on('console', (m) => {
  const t = m.type();
  if (t === 'error' || t === 'warning') console.log(`[console.${t}]`, m.text().slice(0, 300));
});
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
page.on('requestfailed', (r) => console.log('[requestfailed]', r.url(), r.failure()?.errorText));

await page.goto(url, { waitUntil: 'networkidle' }).catch((e) => console.log('[goto]', e.message));
await page.waitForTimeout(2500);

const step = async (name, fn) => {
  try { console.log(`\n== ${name} ==`); await fn(); }
  catch (e) { console.log(`   FAIL: ${e.message.split('\n')[0]}`); }
};

await step('初始状态', async () => {
  console.log('   title:', await page.title());
  console.log('   image-slot defined:', await page.evaluate(() => !!customElements.get('image-slot')));
  console.log('   placeholders:', await page.evaluate(() =>
    [...document.querySelectorAll('.sc-placeholder')].map((p) => p.getAttribute('title') + ' | err:' + (p.textContent || '').trim()).join(' ;; ') || '(none)'));
});

await step('点击底部“发布”', async () => {
  await page.locator('text=发布 post').first().click({ timeout: 5000 });
  await page.waitForTimeout(400);
  console.log('   发布面板可见:', await page.locator('text=发布 · publish').first().isVisible().catch(() => false));
});

await step('点击“拍照识别”', async () => {
  await page.locator('text=拍照识别').first().click({ timeout: 5000 });
  await page.waitForTimeout(600);
  console.log('   识别页可见:', await page.locator('text=宠物识别').first().isVisible().catch(() => false));
});

await step('检查图片槽(白框)', async () => {
  const info = await page.evaluate(() => {
    const el = document.getElementById('camera-shot');
    if (!el) return { found: false, ph: [...document.querySelectorAll('.sc-placeholder')].map((p) => (p.getAttribute('title') || '') + '|' + (p.textContent || '').trim()) };
    const r = el.getBoundingClientRect();
    const topEl = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      found: true, tag: el.tagName, upgraded: !!el.shadowRoot,
      rect: `${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)}`,
      editable: el.hasAttribute('data-editable'),
      filled: el.hasAttribute('data-filled'),
      hitTop: topEl ? topEl.tagName + '.' + (topEl.className && topEl.className.baseVal !== undefined ? topEl.className.baseVal : topEl.className || '') : '(null)',
    };
  });
  console.log('  ', JSON.stringify(info));
});

await step('点击白框 → 是否弹出文件选择', async () => {
  const slot = page.locator('#camera-shot');
  const chooser = page.waitForEvent('filechooser', { timeout: 3000 }).then(
    (fc) => ({ ok: true, fc }), () => ({ ok: false }));
  await slot.click({ timeout: 3000, force: false }).catch(async (e) => {
    console.log('   click 被拦截:', e.message.split('\n')[0]);
    await slot.click({ force: true });
  });
  const res = await chooser;
  console.log('   filechooser 弹出:', res.ok);
  if (res.ok) {
    await res.fc.setFiles(join(here, '..', 'project', 'petlib', 'catt-1.jpg'));
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => {
      const el = document.getElementById('camera-shot');
      const img = el && el.shadowRoot && el.shadowRoot.querySelector('.frame img');
      return { filled: el && el.hasAttribute('data-filled'), imgShown: !!(img && img.style.display !== 'none' && img.src.startsWith('data:')) };
    });
    console.log('   上传后图片显示:', JSON.stringify(after));
  }
});

await step('等待 CLIP 识别结果(首次需下载模型)', async () => {
  await page.locator('text=相似度').first().waitFor({ timeout: 180000 });
  const cards = await page.evaluate(() =>
    [...document.querySelectorAll('div')].filter((d) => /相似度 \d+%/.test(d.textContent) && d.children.length === 0)
      .map((d) => d.closest('[style*="cursor:pointer"]')?.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean));
  [...new Set(cards)].forEach((c) => console.log('   ·', c));
});

await page.screenshot({ path: join(here, 'sim-recognize.png') });
console.log('\nscreenshot -> tools/sim-recognize.png');
await browser.close();
