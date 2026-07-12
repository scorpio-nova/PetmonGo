// 检查提交页表单结构:字段、下拉选项、按钮
import { chromium } from 'playwright-core';
const exe = '/Users/serena/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage();
await page.goto('https://shenicest.com/c005-project-submit.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const out = { inputs: [], selects: [], textareas: [], buttons: [] };
  document.querySelectorAll('input').forEach((i) => out.inputs.push({
    id: i.id, name: i.name, type: i.type, placeholder: i.placeholder,
    maxLength: i.maxLength > 0 ? i.maxLength : undefined, disabled: i.disabled,
    visible: !!(i.offsetWidth || i.offsetHeight),
  }));
  document.querySelectorAll('select').forEach((s) => out.selects.push({
    id: s.id, name: s.name, disabled: s.disabled,
    options: [...s.options].map((o) => ({ value: o.value, text: o.text })),
  }));
  document.querySelectorAll('textarea').forEach((t) => out.textareas.push({
    id: t.id, name: t.name, placeholder: (t.placeholder || '').slice(0, 200),
    maxLength: t.maxLength > 0 ? t.maxLength : undefined,
  }));
  document.querySelectorAll('button').forEach((b) => out.buttons.push({
    id: b.id, text: b.textContent.trim().slice(0, 30), disabled: b.disabled,
    visible: !!(b.offsetWidth || b.offsetHeight),
  }));
  // 各字段的 label 说明
  out.labels = [...document.querySelectorAll('label, .field-label, .hint, .note, small')]
    .map((l) => l.textContent.replace(/\s+/g, ' ').trim()).filter((t) => t && t.length < 200);
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
