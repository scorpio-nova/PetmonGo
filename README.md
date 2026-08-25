# 🐾 Petmon Go · 街区宠物地图

> 把身边的猫猫狗狗，变成一张可以收集、共建的街区地图。

Petmon Go 是一个面向社区的微信小程序。用户可以在地图上发现附近宠物、查看宠物图鉴与相遇记录，并发布走失、抓人、咬人等安全事件。项目同时保留轻量的收集玩法，希望让邻里共享宠物信息这件事既实用，也有温度。

## 当前实现状态

当前主应用位于 [`petmon-go-mini/`](petmon-go-mini)，运行目标是微信小程序。

项目正在从静态演示数据迁移到微信云开发：

- 微信登录与安全事件发布已经接入云函数；
- 宠物、相遇、通知等云函数和前端 API 封装已经存在；
- 地图、探索、图鉴、详情和部分通知交互目前仍主要使用 `src/data/` 与本地存储；
- 小程序内的宠物拍照识别入口目前仍处于开发中。

根目录的 [`project/`](project) 是早期浏览器原型和设计验证，其中包含本地 CLIP 识别实验。它用于历史参考，不是当前微信小程序的主要开发入口。

## 主要功能

| 功能 | 当前说明 |
| --- | --- |
| 街区地图 | 展示附近宠物和地图标记，支持游客与登录状态下的不同入口 |
| 探索与图鉴 | 浏览宠物、事件和收集状态，查看宠物详情与踪迹 |
| 相遇记录 | 选择图片并记录一次相遇；云端写入链路已提供，页面仍在逐步接入 |
| 安全事件 | 登录后通过 `addEvent` 云函数发布事件，并执行文本内容安全检查 |
| 用户与通知 | 云端用户、通知模型及查询函数已建立，部分页面仍使用本地状态 |
| 自动体验版 | `develop` 更新后由 GitHub Actions 构建并上传微信体验版 |

## 技术栈

### 小程序前端

- uni-app 3
- Vue 3 Composition API
- TypeScript 4.9
- Vite 5
- SCSS
- 微信小程序原生能力：地图、图片选择、用户资料、位置权限

### 云开发后端

- 微信云开发 `wx.cloud`
- Node.js 云函数与 `wx-server-sdk`
- 云数据库：`users`、`pets`、`encounters`、`events`、`notices`
- 云存储：宠物和相遇照片
- 微信 OpenAPI 内容安全检查

### 工程与发布

- npm lockfile + `npm ci`
- GitHub Actions
- `miniprogram-ci`
- 微信开发者工具

## 前后端调用链

小程序启动时由 `src/App.vue` 初始化微信云开发。推荐的业务调用链是：

```text
Vue 页面
  -> src/api/*.ts
  -> src/utils/cloud.ts
  -> wx.cloud.callFunction
  -> cloudfunctions/*
  -> 云数据库 / 云存储 / 微信 OpenAPI
```

现有少数页面仍直接调用 `wx.cloud.callFunction`。新增或重构业务时，优先通过 `src/api/` 统一类型、参数和返回值处理。

当前云函数包括：

| 云函数 | 职责 |
| --- | --- |
| `login` | 根据 OpenID 查询或创建用户 |
| `getPets` | 分页查询宠物，并按登录状态返回踪迹信息 |
| `addPet` | 审核文本、上传照片、创建宠物并更新用户统计 |
| `addEncounter` | 审核内容、保存相遇记录、更新宠物踪迹和通知 |
| `addEvent` | 审核并创建安全事件 |
| `getNotifications` | 分页查询当前用户的通知 |

云函数不会随小程序体验版自动部署。修改 `cloudfunctions/` 后，需要在微信开发者工具中把对应函数部署到目标云环境。

## 仓库结构

```text
.
├── .github/                    # develop 分支的小程序构建与体验版上传
├── petmon-go-mini/             # 当前微信小程序
│   ├── src/
│   │   ├── api/                # 前端云函数 API 封装
│   │   ├── data/               # 迁移期间使用的本地演示数据
│   │   ├── pages/              # 小程序页面
│   │   └── utils/              # 云调用、地图标记等工具
│   ├── cloudfunctions/         # 微信云函数
│   └── tests/                  # 工程和 CI 契约测试
├── project/                    # 历史浏览器原型与设计素材
├── tools/                      # 原型识别、素材与检查脚本
└── CONTRIBUTING.md             # collaborator 与 agent 开发流程
```

## 本地开发

### 环境准备

- Node.js 18（与当前 CI 和 `miniprogram-ci` 配置保持一致）
- npm
- 微信开发者工具
- 已加入项目的小程序 AppID 权限
- 如需测试云端写入，需要拥有目标云开发环境权限

### 安装与启动

```bash
cd petmon-go-mini
npm ci --legacy-peer-deps
npm run dev:mp-weixin
```

开发构建输出位于：

```text
petmon-go-mini/dist/dev/mp-weixin
```

在微信开发者工具中导入该目录，并使用已获授权的小程序 AppID。个人 AppID、私钥和开发者工具私有配置不得提交到仓库。

生产构建命令：

```bash
npm run build:mp-weixin
```

输出位于 `petmon-go-mini/dist/build/mp-weixin`。

### 云开发配置

数据库集合、云函数部署与内容安全配置参见 [`petmon-go-mini/CLOUD_SETUP.md`](petmon-go-mini/CLOUD_SETUP.md)。

协作开发时不要未经沟通替换并提交共享云环境 ID。需要独立后端测试时，应使用个人测试环境，并确保环境差异不会进入提交。

## 分支与体验版

协作者从最新 `develop` 创建自己的 `feature/<name>-<topic>` 分支，在 feature 分支完成开发和微信开发者工具测试。稳定后再合并回 `develop`。

`develop` 每次推送都会触发 [GitHub Actions](https://github.com/scorpio-nova/PetmonGo/actions)：安装依赖、验证上传契约、构建微信小程序，并通过 `miniprogram-ci` 上传体验版。

完整开发、验收和 agent 行为规范见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 安全注意事项

- 不提交小程序代码上传私钥、GitHub Actions Secrets 或其他凭据；
- 不提交个人 `project.private.config.json`、`.env`、日志或构建产物；
- 云数据库写操作应通过云函数执行，并使用 OpenID 做身份边界；
- 用户输入、图片和公开事件内容应经过内容安全检查；
- 共享云环境中的数据和云函数部署属于外部状态，修改前需要确认目标环境。

---

<p align="center">🐱 遇见每一只，记住每一只 🐶</p>
