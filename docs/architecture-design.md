# Petmon Go - 架构设计文档

> 基于当前代码库的完整分析，为前后端分离改造提供基础参考。

---

## 1. 项目概览

**Petmon Go** 包含早期纯静态网页和当前微信小程序两套实现。当前小程序版本使用微信云开发 API，并计划通过微信云托管承载 CLIP 宠物识别服务。

### 关键信息

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/scorpio-nova/PetmonGo |
| 在线部署 | https://petmongo.softlanding.com.cn/ |
| 部署方式 | 纯静态站（Nginx + cron 拉取 GitHub） |
| 技术框架 | dc-runtime（基于 React 的组件化 HTML/CSS/JS 框架） |
| AI 能力 | 微信云托管中的量化 ONNX CLIP 图像识别服务 |
| 入口文件 | `project/petmon go.dc.html` |
| 运行环境 | 纯浏览器端，无后端 |

---

## 2. 完整文件结构

```
petmon-go/
├── CLAUDE.md                         # Multica 代理运行时配置
├── README.md                         # 项目说明（Claude Design 导出包说明）
├── SUBMISSION.md                     # 黑客松提交内容草稿
│
├── deploy/                           # 部署相关
│   ├── README.md                     # 部署说明文档（阿里云 + cron 自动部署）
│   ├── deploy.sh                     # 自动部署脚本（git fetch + reset --hard）
│   └── nginx.conf.example            # Nginx 配置示例
│
├── project/                          # 主项目代码
│   ├── petmon go.dc.html             # 【核心入口】主 HTML 页面（~1000 行）
│   ├── support.js                    # dc-runtime 运行时（~1768 行，React 渲染引擎）
│   ├── pet-match.js                  # 宠物识别模块（CLIP 浏览器端推理）
│   ├── image-slot.js                 # 图片上传槽 Web Component（~1197 行）
│   │
│   ├── assets/                       # 图标与 UI 资源
│   │   ├── cat.png, dog.png          # 猫/狗图标
│   │   ├── cafe.png, hospital.png    # 地点图标
│   │   ├── park.png, water.png       # 公共设施图标
│   │   ├── pin.png                   # 地图标记 Pin
│   │   ├── sqframe.png, mapframe.png # 相框
│   │   ├── medal.png                 # 成就奖牌
│   │   ├── label.png, label-lg-b.png # 标签
│   │   ├── catfood.png, dogfood.png  # 投喂图标
│   │   └── pack/                     # 设计素材包（UI 组件 PNG 切图）
│   │
│   ├── petlib/                       # 宠物图库（用于 CLIP 识别比对）
│   │   ├── embeddings.js             # 预计算的 CLIP 向量（window.PETLIB_EMBEDDINGS）
│   │   ├── embeddings.json           # 预计算的 CLIP 向量（JSON 格式）
│   │   ├── catt-1.jpg, catt-2.jpg    # 各宠物照片
│   │   ├── scar-1.jpg                # 天使宠物 Scar 的照片
│   │   ├── memw-2.jpg, dada-1.jpg    # ...
│   │   ├── onion-1.jpg, mochi-1.jpg
│   │   └── *_pin*.jpg               # 图库散图（未收录宠物）
│   │
│   ├── screenshots/                  # 项目截图
│   │   ├── 01-check.png ~ 07-check.png
│   │   └── me-ribbon.png
│   │
│   └── uploads/                      # 上传资源
│       ├── *.JPG, *.PNG              # 用户/设计参考照片
│       ├── whiteboard-flowchart.md   # 产品流程图（Mermaid）
│       ├── whiteboard_exported_image (1).pdf
│       └── 小动物地图- demo素材包/   # 设计素材包
│
├── tools/                            # 开发工具
│   ├── package.json                  # Node.js 依赖
│   ├── package-lock.json
│   ├── build-embeddings.mjs          # 【工具】离线生成 CLIP embedding 向量
│   ├── sim-flow.mjs                  # 【工具】Playwright 自动化测试流程
│   ├── inspect-submit.mjs            # 【工具】检查黑客松提交页表单结构
│   ├── sim-recognize.png             # 自动化测试截图
│   └── node_modules/                 # 依赖
│
├── docs/                             # 文档目录（本次新增）
│   └── architecture-design.md        # 本文件
│
└── .claude/                          # Claude Code 配置
```

---

## 3. 技术架构详解

### 3.1 运行时框架：dc-runtime

项目使用 **dc-runtime**（Design Component Runtime），一个基于 React 的组件化框架：

- **入口**：`project/support.js` — 这是 dc-runtime 的编译后产物（~1768 行）
- **渲染机制**：将 `.dc.html` 文件中的 `<x-dc>` 模板编译为 React 组件
- **模板语法**：`{{ expression }}` 数据绑定、`<sc-if>` 条件渲染、`<sc-for>` 列表渲染
- **组件模型**：`class Component extends DCLogic` 定义组件逻辑，`renderVals()` 返回模板数据
- **外部组件**：通过 `<x-import>` 加载外部 JS 组件（如 `image-slot.js`）
- **React CDN**：从 unpkg.com 加载 React 18.3.1 UMD 版本
- **依赖**：React、ReactDOM、Babel（用于 JSX 运行时编译）

### 3.2 页面结构（单页应用）

主文件 `petmon go.dc.html` 是一个 **单 HTML 文件的 SPA**，包含所有页面：

| 页面 | 标识 | 说明 |
|---|---|---|
| P01 地图首页 | `showMap` | 宠物 Pin 地图 + 附近列表 + 安全事件 + 友好地点 |
| P02 探索页 | `showExplore` | 附近宠物 + 安全事件 + 宠物日志 + 天使故事 + 地点评价 + 遛宠路线 |
| P03 上传相遇 | `showUpload` | 拍照上传 + 地点 + 备注 |
| P04 宠物详情 | `showPet` | 弹窗模态框，宠物档案（只读） |
| P05 安全事件发布 | `showPubEvent` | 事件类型选择 + 描述 + 定位 |
| P06 图鉴 | `showDex` | 已收集宠物网格，新动态红点 |
| P07 宠物识别 | `showRecognize` | CLIP 识别 + 匹配结果 |
| P08 新宠物建档 | `showNewPet` | 名称 + 类型 + Tag + 踪迹 |
| P09 天使纪念卡 | `showAngel` | 彩虹框 + 送礼物 |
| P10 事件详情 | `showEvent` | 安全事件只读详情 |
| 发布面板 | `showPub` | 底部弹出：拍照识别 / 发布事件 |
| 消息中心 | `showInbox` | 通知列表 |

### 3.3 状态管理

所有状态集中在 `Component` 类的 `this.state` 中：

```javascript
state = {
  tab: 'map',              // 底部 Tab：map | explore | dex | me
  view: null,              // 当前视图/模态框
  petId: null,             // 当前查看的宠物 ID
  eventId: null,           // 当前查看的事件 ID
  gifted: false,           // 天使宠物是否已送礼
  pets: [...],             // 15 只宠物的完整数据（内联硬编码）
  events: [...],           // 安全事件列表
  notices: [...],          // 消息通知列表
  matchStatus: 'idle',     // CLIP 识别状态
  matchResults: [],        // 识别匹配结果
  // ... 其他 UI 状态
}
```

**关键点**：当前所有数据都是 **硬编码在前端 state 中**，没有持久化、没有后端、没有数据库。

### 3.4 AI 识别能力（CLIP）

`pet-match.js` 实现了浏览器端宠物识别：

1. **模型**：Xenova/clip-vit-base-patch32（~30MB，首次使用从 jsdelivr CDN 下载）
2. **向量库**：`petlib/embeddings.js` 包含 18 只宠物的 512 维预计算向量
3. **匹配流程**：上传图片 -> transformers.js 编码为向量 -> 余弦相似度比对 -> Top3 排序返回
4. **离线工具**：`tools/build-embeddings.mjs` 使用 Node.js + @xenova/transformers 离线生成 embeddings

### 3.5 组件系统

- **image-slot**（`image-slot.js`）：Web Component，用户可拖拽/点击上传图片，带 Unsplash 版权归属性要求，支持图片裁剪/缩放/平移，持久化到 `.image-slots.state.json` sidecar 文件
- **SVG 图标系统**：所有图标（猫、狗、天使、相机、地图等）内联在 HTML 中作为 SVG symbol，通过 `<use href="#c-xxx"/>` 引用
- **手绘风 UI**：使用 SVG filter `url(#pen)` 实现手绘风格线条效果

---

## 4. 部署架构

```
GitHub (main branch)
    ↓ cron 每分钟 git fetch
阿里云服务器 (/var/www/petmon-go/repo)
    ↓ deploy.sh: git reset --hard + cp index.html
Nginx (petmongo.softlanding.com.cn)
    ↓ 静态文件服务
用户浏览器
```

- **部署脚本**：`deploy/deploy.sh` — cron 每分钟执行，有更新才部署
- **入口复制**：`petmon go.dc.html` -> `index.html`（解决文件名带空格问题）
- **Nginx 配置**：SPA fallback + `.wasm/.onnx` MIME 类型 + 缓存策略
- **HTTPS**：certbot 自动配置

---

## 5. 现有数据模型（前端硬编码）

### 宠物数据结构

```javascript
{
  id: 'cat1',           // 唯一标识
  en: 'Catt',           // 英文名
  cn: '橘座',           // 中文名
  kind: 'cat',          // cat | dog
  breed: '奶牛猫',       // 品种
  tag: '野生',           // 野生 | 家养 | 天使
  area: 'Block A 小区', // 所在区域
  xy: [76, 26],         // 虚拟地图坐标（0-100 百分比）
  stars: 4,             // 星级 1-5
  seen: 105,            // 被偶遇次数
  collected: true,      // 是否已收集进图鉴
  hasUpdate: false,     // 是否有新动态
  note: '...',           // 描述
  trace: [              // 今日踪迹
    { t: '08:20', p: '花坛边晒太阳' }
  ]
}
```

### 安全事件数据结构

```javascript
{
  id: 'e1',
  type: '丢失',           // 虐猫 | 丢失 | 抓人 | 咬人
  title: '小白走丢了',
  place: 'Maple St 街角',
  time: '2 小时前',
  by: 'Momo',
  desc: '...'
}
```

### 消息通知数据结构

```javascript
{
  id: 'n1',
  icon: 'catfood',       // 图标类型
  bg: '#fff8e2',         // 背景色
  title: 'Memw 收到新投喂',
  body: 'Mille 在咪想咖啡门口留下小鱼干',
  unread: false
}
```

---

## 6. 前后端分离改造方向（待规划）

基于当前架构分析，改造需要关注以下方面：

### 需要分离的部分

| 当前（前端） | 改造后（后端） |
|---|---|
| `pets[]` 硬编码数据 | 数据库持久化（用户创建的宠物、踪迹） |
| `events[]` 硬编码数据 | 数据库存储 + API |
| `notices[]` 硬编码数据 | 推送通知系统 |
| 无用户系统 | 账号注册/登录（手机号 + 验证码） |
| `matchStatus` 纯前端 | 识别结果可选上报到后端 |
| 无持久化 | 图片上传到 OSS/存储服务 |

### 当前技术栈可复用的部分

- dc-runtime 组件化架构可继续使用（前端渲染层）
- CLIP 识别模型放在微信云托管/HTTP 容器，避免进入小程序包
- image-slot 组件的上传/持久化机制可扩展
- SVG 图标系统和手绘风 UI 设计可保持

### 需要新增的技术组件

- 后端 API 服务（推荐 Node.js/Python）
- 数据库（推荐 PostgreSQL + PostGIS 用于地理查询）
- 用户认证系统
- 文件存储服务
- 推送通知服务

---

## 7. 关键文件索引

| 文件 | 用途 | 行数 |
|---|---|---|
| `project/petmon go.dc.html` | 主页面（模板 + 组件逻辑） | ~1018 |
| `project/support.js` | dc-runtime 运行时 | ~1768 |
| `project/pet-match.js` | CLIP 宠物识别 | ~67 |
| `project/image-slot.js` | 图片上传 Web Component | ~1197 |
| `project/petlib/embeddings.js` | CLIP 向量数据 | 自动生成 |
| `project/petlib/embeddings.json` | CLIP 向量数据（JSON） | 自动生成 |
| `tools/build-embeddings.mjs` | 离线生成 embedding 工具 | ~38 |
| `tools/sim-flow.mjs` | 自动化测试工具 | ~100 |
| `deploy/deploy.sh` | 自动部署脚本 | ~30 |
| `deploy/nginx.conf.example` | Nginx 配置 | ~41 |
| `project/uploads/whiteboard-flowchart.md` | 产品流程图 | ~82 |
