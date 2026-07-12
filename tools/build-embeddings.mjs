// 离线预计算宠物图库的 CLIP 图片 embedding。
// 用法: node build-embeddings.mjs
// 输出: ../project/petlib/embeddings.json  { model, dim, pets: [{id, file, vec}] }
//       ../project/petlib/embeddings.js    同一份数据挂到 window.PETLIB_EMBEDDINGS,
//                                          供页面在 file:// 下以 <script> 加载
//
// 模型直接用 CLIP 视觉塔(CLIPVisionModelWithProjection)输出 512 维 image_embeds,
// 与浏览器端 pet-match.js 完全同一路径,保证图库向量与查询向量可比。
// 默认从自托管的 ../project/models 读模型(离线,无需联网);缺文件时才回退到远程 hub。
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } from '@xenova/transformers';
import { readdir, writeFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const libDir = join(here, '..', 'project', 'petlib');
const modelsDir = join(here, '..', 'project', 'models');
const MODEL = 'Xenova/clip-vit-base-patch32';

// 有本地自托管模型就走本地(离线);否则联网拉取(需能连 huggingface,国内一般要代理)。
const localOnnx = join(modelsDir, MODEL, 'onnx', 'vision_model_quantized.onnx');
const hasLocal = await access(localOnnx).then(() => true).catch(() => false);
if (hasLocal) {
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = modelsDir;
  console.log('using local models at', modelsDir);
} else {
  console.log('local models not found, will fetch from remote hub');
}

const processor = await AutoProcessor.from_pretrained(MODEL);
const vision = await CLIPVisionModelWithProjection.from_pretrained(MODEL, { quantized: true });

const files = (await readdir(libDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const pets = [];
for (const file of files) {
  const img = await RawImage.read(join(libDir, file));
  const { pixel_values } = await processor(img);
  const out = await vision({ pixel_values });
  let vec = Array.from(out.image_embeds.data);
  const norm = Math.hypot(...vec);
  vec = vec.map((v) => +(v / norm).toFixed(6));
  // 文件名约定 <petId>-<n>.jpg，petId 对应 app 里 state.pets 的 id 前缀;
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
