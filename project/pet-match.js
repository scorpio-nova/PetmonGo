// pet-match.js — 浏览器端宠物相似度匹配(纯前端,无后端,全站自托管)。
//
// 原理:用 transformers.js 在浏览器里跑 CLIP 视觉塔(CLIPVisionModelWithProjection,
// Xenova/clip-vit-base-patch32),把用户上传的图片编码成 512 维 image_embeds,
// 与 petlib/embeddings.json 里预计算好的图库向量做余弦相似度,按每只宠物取最高分排序。
//
// ★ 自托管:库(transformers.min.js)、onnxruntime 的 .wasm、CLIP 视觉模型全部放本站,
//   不再依赖 jsdelivr / huggingface.co(国内直连 huggingface 不通)。资源布局:
//     ./vendor/transformers.min.js              transformers.js 浏览器构建
//     ./vendor/ort/ort-wasm*.wasm               onnxruntime-web 运行时
//     ./models/Xenova/clip-vit-base-patch32/    config + preprocessor + onnx/vision_model_quantized.onnx
//   这套文件由 tools/build-embeddings.mjs 同源模型生成,离线验证 cos=1.0。
//
// 图库向量优先读 window.PETLIB_EMBEDDINGS(petlib/embeddings.js,普通 script 引入,
// file:// 下也能用);没有时才 fetch embeddings.json(需 HTTP 访问)。
window.petMatch = (() => {
  const LIB = './petlib/';
  const BASE = './';                              // 站点根(index.html 同级);相对 document base 解析
  const TF = BASE + 'vendor/transformers.min.js'; // 本站 transformers.js
  // 图库文件名前缀 -> app 内 state.pets 的 id
  const ID_MAP = {
    catt: 'cat1', memw: 'cat2', dada: 'dog1', onion: 'cat3', scar: 'cat4', mochi: 'cat5',
    '02_pin7011961860': 'cat6',  '19_pin6780225098': 'cat7',  '21_pin7032012205': 'cat8',
    '22_pin7030436621': 'cat9',  '23_pin3860038557': 'cat10', '26_pin5120886183': 'cat11',
    '27_pin7018578576': 'cat12', '30_pin5623092788': 'dog2',  '36_pin5157752165': 'dog3',
    '42_pin7032488465': 'cat13', '46_pin2911788931': 'cat14', '48_pin3568876602': 'cat15',
  };

  let ready = null;

  async function load() {
    const libP = window.PETLIB_EMBEDDINGS
      ? Promise.resolve(window.PETLIB_EMBEDDINGS)
      : fetch(LIB + 'embeddings.json').then((r) => {
          if (!r.ok) throw new Error('加载 petlib/embeddings.json 失败(需通过 HTTP 打开页面)');
          return r.json();
        });
    const [tf, lib] = await Promise.all([import(TF), libP]);
    const { env, AutoProcessor, CLIPVisionModelWithProjection, RawImage } = tf;

    // 只走本站:禁远程 hub,模型/运行时都指到本地路径
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = BASE + 'models/';                 // -> ./models/Xenova/clip-vit-base-patch32/…
    env.backends.onnx.wasm.wasmPaths = BASE + 'vendor/ort/';
    env.backends.onnx.wasm.numThreads = 1;                 // 单线程:免 SharedArrayBuffer / 跨源隔离,用非线程版 wasm

    const model = lib.model || 'Xenova/clip-vit-base-patch32';
    const [processor, vision] = await Promise.all([
      AutoProcessor.from_pretrained(model),
      CLIPVisionModelWithProjection.from_pretrained(model, { quantized: true }),
    ]);
    return { processor, vision, lib, RawImage };
  }

  // 提前调用可在用户上传前预热模型(加载 + 初始化)。
  function ensure() {
    return ready || (ready = load().catch((e) => { ready = null; throw e; }));
  }

  // imageUrl: dataURL 或普通 URL。返回 [{petId, score, file}] 按相似度降序,每只宠物一条。
  async function match(imageUrl) {
    const { processor, vision, lib, RawImage } = await ensure();
    const img = await RawImage.read(imageUrl);
    const { pixel_values } = await processor(img);
    const out = await vision({ pixel_values });
    const v = Array.from(out.image_embeds.data);
    let n = 0;
    for (const x of v) n += x * x;
    n = Math.sqrt(n) || 1;

    const best = new Map();
    for (const p of lib.pets) {
      let s = 0;
      for (let i = 0; i < p.vec.length; i++) s += (v[i] / n) * p.vec[i];
      const petId = ID_MAP[p.id] || p.id;
      const cur = best.get(petId);
      if (!cur || s > cur.score) best.set(petId, { petId, score: s, file: LIB + p.file });
    }
    return [...best.values()].sort((a, b) => b.score - a.score);
  }

  return { ensure, match };
})();
