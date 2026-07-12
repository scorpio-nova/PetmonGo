// 离线预计算宠物图库的 CLIP 图片 embedding。
// 用法: node build-embeddings.mjs
// 输出: ../project/petlib/embeddings.json  { model, dim, pets: [{id, file, vec}] }
//       ../project/petlib/embeddings.js    同一份数据挂到 window.PETLIB_EMBEDDINGS,
//                                          供页面在 file:// 下以 <script> 加载
import { pipeline, RawImage } from '@xenova/transformers';
import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const libDir = join(here, '..', 'project', 'petlib');

const MODEL = 'Xenova/clip-vit-base-patch32';
const extractor = await pipeline('image-feature-extraction', MODEL, { quantized: true });

const files = (await readdir(libDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const pets = [];
for (const file of files) {
  const img = await RawImage.read(join(libDir, file));
  const out = await extractor(img);
  let vec = Array.from(out.data);
  const norm = Math.hypot(...vec);
  vec = vec.map((v) => +(v / norm).toFixed(6));
  // 文件名约定 <petId>-<n>.jpg，petId 对应 app 里 state.pets 的 id 前缀；
  // 无 -n 后缀的文件(如 02_pin….jpg)各自视为独立个体，id 取去扩展名的文件名
  const id = file.replace(/-\d+(?=\.\w+$)/, '').replace(/\.\w+$/, '');
  pets.push({ id, file, vec });
  console.log(`${file} -> ${id} (dim ${vec.length})`);
}

const json = JSON.stringify({ model: MODEL, dim: pets[0]?.vec.length ?? 0, pets });
await writeFile(join(libDir, 'embeddings.json'), json);
await writeFile(
  join(libDir, 'embeddings.js'),
  `// 由 tools/build-embeddings.mjs 生成 — embeddings.json 的 file:// 可用版本\nwindow.PETLIB_EMBEDDINGS = ${json};\n`
);
console.log(`wrote ${pets.length} embeddings to petlib/embeddings.{json,js}`);
