// pet-match.js — 浏览器端宠物相似度匹配(纯前端,无后端)。
//
// 原理:用 transformers.js 在浏览器里跑 CLIP (Xenova/clip-vit-base-patch32),
// 把用户上传的图片编码成 512 维向量,与 petlib/embeddings.json 里预计算好的
// 图库向量做余弦相似度,按每只宠物取最高分排序。
//
// 图库照片放在 ./petlib/<petId>-<n>.jpg,embeddings.json 由
// tools/build-embeddings.mjs 离线生成(node tools/build-embeddings.mjs)。
//
// 图库向量优先读 window.PETLIB_EMBEDDINGS(petlib/embeddings.js,普通 script
// 引入,file:// 下也能用);没有时才 fetch embeddings.json(需 HTTP 访问)。
// 首次匹配会从 CDN 下载模型(约 30MB),之后走缓存。
window.petMatch = (() => {
  const LIB = './petlib/';
  const CDN = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
  // 图库文件名前缀 -> app 内 state.pets 的 id
  const ID_MAP = { catt: 'cat1', memw: 'cat2', dada: 'dog1', onion: 'cat3', scar: 'cat4', mochi: 'cat5' };

  let ready = null;

  async function load() {
    const libP = window.PETLIB_EMBEDDINGS
      ? Promise.resolve(window.PETLIB_EMBEDDINGS)
      : fetch(LIB + 'embeddings.json').then((r) => {
          if (!r.ok) throw new Error('加载 petlib/embeddings.json 失败(需通过 HTTP 打开页面)');
          return r.json();
        });
    const [tf, lib] = await Promise.all([import(CDN), libP]);
    tf.env.allowLocalModels = false;
    const extractor = await tf.pipeline('image-feature-extraction', lib.model, { quantized: true });
    return { extractor, lib, RawImage: tf.RawImage };
  }

  // 提前调用可在用户上传前预热模型(下载 + 初始化)。
  function ensure() {
    return ready || (ready = load().catch((e) => { ready = null; throw e; }));
  }

  // imageUrl: dataURL 或普通 URL。返回 [{petId, score, file}] 按相似度降序,每只宠物一条。
  async function match(imageUrl) {
    const { extractor, lib, RawImage } = await ensure();
    const img = await RawImage.read(imageUrl);
    const out = await extractor(img);
    const v = Array.from(out.data);
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
