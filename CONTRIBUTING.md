# Contributing to Petmon Go

本文面向项目 collaborator，以及代表 collaborator 执行开发任务的 coding agent。目标是让每项改动都在独立 feature 分支中完成、可在微信开发者工具验证，并以稳定状态进入 `develop`。

## 1. 分支模型

- `develop` 是当前集成分支，也是微信体验版的自动发布来源；
- 每个任务从最新 `develop` 创建独立 feature 分支；
- 不直接在 `develop` 上编写或提交业务改动；
- 一个分支只处理一个明确主题，避免夹带无关重构；
- 推荐命名：`feature/<collaborator>-<topic>`，例如 `feature/alice-pet-search`。

开始任务前：

```bash
git status --short --branch
git switch develop
git pull --ff-only origin develop
git switch -c feature/<collaborator>-<topic>
```

如果工作区已有未提交修改，先确认其归属。不要覆盖、暂存或删除其他 collaborator 的工作来获得“干净”状态。

## 2. Agent 开始工作前

Agent 应先完成以下检查，再修改文件：

1. 阅读 `README.md`、本文件以及与任务相关的页面、API 和云函数；
2. 运行 `git status`，识别已有修改和当前分支；
3. 确认需求影响前端、云函数、数据库结构还是 CI；
4. 找到现有实现和数据流，优先沿用已有模式；
5. 明确验收方式，包括命令行检查和微信开发者工具中的交互路径。

Agent 应保持改动最小且可审阅，不擅自进行大范围格式化、依赖升级、数据迁移或共享云环境操作。需要改变任务范围或修改外部状态时，先取得 collaborator 明确确认。

## 3. 安装与开发

进入当前小程序目录：

```bash
cd petmon-go-mini
npm ci --legacy-peer-deps
npm run dev:mp-weixin
```

uni-app 的开发输出位于：

```text
petmon-go-mini/dist/dev/mp-weixin
```

在微信开发者工具中导入该目录。使用团队授权的 AppID 或个人可用的测试 AppID；本地 AppID、上传私钥和开发者工具私有配置不得进入提交。

`npm run dev:mp-weixin` 是持续编译进程。修改源码后，等待编译完成，再回到微信开发者工具重新编译或热刷新验证。

## 4. 前端开发约定

- 页面和组件使用 Vue 3 `<script setup lang="ts">`；
- 新增云端业务调用时，优先在 `src/api/` 定义参数、返回值和调用函数；
- 通过 `src/utils/cloud.ts` 统一调用云函数，避免继续扩散页面内的直接调用；
- `src/data/` 是迁移期间的本地演示数据。接入云数据时要保留明确的加载、空状态和失败处理，不要静默混用两套来源；
- 涉及游客和登录用户时，分别验证可见信息、登录提示和受限操作；
- 地图坐标、用户输入和图片选择应考虑权限拒绝、数据缺失及接口失败；
- 保持现有手绘视觉语言，不在功能改动中顺带替换整套样式。

## 5. 云开发约定

当前前端到后端的推荐链路为：

```text
page/component -> src/api -> src/utils/cloud -> cloud function
               -> database / storage / OpenAPI
```

修改云端逻辑时，应同步检查：

- `cloudfunctions/<name>/index.js` 的参数校验、返回结构与错误处理；
- `src/api/*.ts` 的 TypeScript 类型和调用方；
- `users`、`pets`、`encounters`、`events`、`notices` 集合字段与权限；
- 用户文本和图片是否需要内容安全检查；
- 云存储路径是否按 OpenID 或业务对象隔离；
- 游客是否会收到不应公开的精确位置或用户信息。

云函数不会由当前 GitHub Actions 自动部署。修改云函数后，在微信开发者工具中右键对应目录，选择“上传并部署：云端安装依赖”，并确认部署的是测试/开发环境。

未经明确授权，Agent 不得重置云环境、删除集合、批量修改共享数据或部署到生产环境。

## 6. 本地验证

验证范围应与改动风险匹配。至少执行与改动相关的检查，并记录实际结果。

### 常用命令

```bash
cd petmon-go-mini

# 项目测试入口
npm test

# TypeScript 检查
npm run type-check

# 微信小程序生产构建
npm run build:mp-weixin

# CI 上传脚本或工作流改动
node tests/ci-upload.test.mjs
```

当前仓库有两组已知检查基线：

- `npm test` 引用了尚未提交的 `tests/map-markers.test.ts` 和 `tests/release-readiness.test.mjs`，当前会先以 `TS6053` 停在缺失的地图标记测试文件；
- `npm run type-check` 中，`App.vue`、云调用工具和两个发布页面使用了微信全局对象 `wx`，但 TypeScript 工程尚未声明该全局类型，因此会报告 7 个 `Cannot find name 'wx'`。

执行检查时应记录并区分这些基线错误。任何新增失败仍需在 feature 分支中解决，不能借已有问题一并忽略；修复这些基线时应使用单独任务和 feature 分支。

不要只因为命令没有覆盖业务交互，就声称功能已经验证。前端改动还需要在微信开发者工具中走通相关页面。

### 微信开发者工具验收

根据任务至少覆盖：

- 首次进入与重新进入；
- 游客状态和登录状态；
- 正常数据、空数据和失败提示；
- 页面跳转、返回和 TabBar 状态；
- 图片、位置等权限允许与拒绝；
- 涉及云函数时，检查云函数日志和对应数据库/云存储结果；
- 真机能力相关改动应补充真机预览，模拟器通过不能替代真机验证。

## 7. 提交前检查

```bash
git status --short
git diff --check
git diff --stat
```

逐项确认：

- 改动只包含当前任务；
- 没有凭据、个人配置、构建产物或调试日志；
- README、云开发说明或接口类型已随行为变化更新；
- 相关命令和微信开发者工具场景已经重新验证；
- 云函数改动已说明部署环境和部署结果。

提交信息应简短说明意图，例如：

```text
feat: add pet search filters
fix: handle denied location permission
docs: document collaborator workflow
```

## 8. 合并到 develop

feature 分支稳定后，可以通过 Pull Request，或由有权限的 collaborator 本地合并。合并前先吸收最新 `develop`，解决冲突并重新验证。

```bash
git switch develop
git pull --ff-only origin develop
git merge --no-ff feature/<collaborator>-<topic>
git push origin develop
```

不要把未经验证的 feature 分支强推到 `develop`，也不要为了解决冲突重写他人的提交历史。

推送 `develop` 后，检查仓库的 GitHub Actions：

1. 安装依赖；
2. 验证 CI 上传契约；
3. 构建 `dist/build/mp-weixin`；
4. 上传微信公众平台体验版。

Action 成功后，再到微信开发者工具或微信公众平台确认体验版版本和关键路径。Action 失败时应先读取失败步骤和微信错误码，不要连续盲目重跑。

## 9. 完成定义

一项任务只有在以下条件满足后才算完成：

- feature 分支中只包含预期改动；
- 对应检查命令有最新的成功记录，或已明确记录现有基线问题；
- 微信开发者工具中的相关流程已验证；
- 必要的云函数已部署到正确环境并验证；
- 文档和接口类型与实际行为一致；
- 改动已经合并到 `develop`；
- `develop` 的 GitHub Action 已通过，体验版可供团队验收。
