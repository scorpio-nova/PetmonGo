# Petmon Go 测试计划 TODO

> 对应方案：[`docs/api-backend-testing-plan.md`](docs/api-backend-testing-plan.md)
> 负责人：待分配
> 当前阶段：测试/预发布环境；本地测试与 CLIP 链路代码已完成，等待微信云托管部署与测试图库配置
> 最后更新：2026-08-30

## 状态说明

- `[x]` 已完成并有命令或文件证据
- `[~]` 部分完成，仍有明确剩余项
- `[ ]` 未开始
- `[!]` 被问题阻断，但已有下一步

## 你需要优先确认的事项

1. **CLIP 推理服务部署配置**（最高优先级）：测试阶段继续使用原环境 `petmon-backend-d0gdzcyjw2d9f70ba`，已确定使用微信云托管；还需确定服务名称、规格、预热实例和公网/内网访问方式。
2. **模型版本**：当前后端默认仓库已有的约 85 MiB 量化 ONNX 视觉权重；如果要与旧网页 `Xenova/clip-vit-base-patch32` 严格对齐，需要确认权重/预处理兼容性。
3. **识别权限**：是否要求用户先登录；当前云函数按上传的 `recognitions/` 文件处理，尚未锁定产品权限策略。
4. **匹配阈值和无匹配体验**：例如低于阈值时显示“未找到可靠匹配”，还是仍展示 Top-K。
5. **图片保留策略**：当前识别输入在云函数结束时尽力删除；请确认是否需要保存识别历史或用于后续训练。
6. **测试云环境与图库**：需要你在微信云开发控制台创建/确认测试环境，并上传可换取临时 URL 的宠物图片。

## 你需要手动验证的事项

- [x] `recognizePet` 云函数已部署并配置 `CLIP_INFERENCE_URL`、`CLIP_INFERENCE_TOKEN`。
- [x] 在推理服务上访问 `/healthz`，确认模型已加载。
- [ ] 在测试云环境上传一张宠物图库照片，确认 `pets.photos[0]` 是正确 `fileID`。
- [ ] 真机/开发者工具选择照片，观察上传、识别耗时、Top-K 结果和失败提示。
- [ ] 断网或让临时 URL 失效，确认页面不会卡死且能恢复/重试。
- [ ] 检查 `recognitions/` 临时文件在成功和失败后均被清理。
- [ ] 确认游客/登录用户的位置和图片权限符合产品预期。

## 当前 CloudBase 访问状态（2026-08-30）

- [x] 本机 CloudBase CLI 授权有效，可读取环境和函数配置。
- [x] 可见环境：`petmon-backend-d0gdzcyjw2d9f70ba`，状态 `NORMAL`。
- [x] 已部署函数：`login`、`getPets`、`addPet`、`addEncounter`、`addEvent`、`getNotifications`、`recognizePet`。
- [x] `recognizePet` 配置为 Nodejs20.19、512 MB、60 秒、CPU。
- [x] `recognizePet` 状态为 `Active/Available`，真实空参数调用 4 ms 返回 `-3`。
- [x] `recognizePet` 环境变量已配置（只记录 key 名，不记录 secret）。
- [x] 当前 CloudRun/云托管服务列表包含 `petmon-clip`。
- [x] 当前云存储文件列表为空，尚无可直接用于 CLIP 候选图库的远程图片。
- [x] `petmon-clip` 已成功创建并发布版本 `petmon-clip-002`。
- [x] `petmon-clip` 已切换 100% 流量到版本 `petmon-clip-002`。
- [x] 构建日志显示容器镜像约 717 MB；模型本体约 85 MiB，其余主要来自 Python/ONNX 运行时依赖。
- [!] 官方成长计划权益页列出的主要权益是 6 个月个人版云开发环境、AI 资源包，或特定条件下的云开发代金券；未承诺/未列出 CloudRun 云托管计算额度。
- [ ] 在控制台核对账户是否有可抵扣云托管的代金券或专项试用额度；不能仅凭“参加成长计划”推断可免费创建 CloudRun。
- [x] 已确认小程序 `wx.cloud.init.env` 与 CloudRun 环境一致；服务名为 `petmon-clip`。
- [x] 用户确认新环境 `petmon-backend-d0gdzcyjw-da10758` 属于另一个账号且已作废；不再使用、不部署、不写入数据。
- [x] 未输入用户密码或 SecretKey；自动生成的服务 token 仅写入目标 CloudRun/云函数环境变量，未打印或提交仓库。

## 里程碑总览

| 里程碑 | 状态 | 验收证据 | 关键节点 |
|---|---|---|---|
| M1 类型检查收紧 | `[x]` | `npm run type-check` | 严格模式进入 PR 门禁 |
| M2 API 类型契约 | `[x]` | `npm run test:api-types` | 非法请求类型不可编译 |
| M3 云函数本地单测 | `[x]` | `npm run test:cloudfunctions`，8/8 | 六个云函数主路径有 mock 覆盖 |
| M4 客户端 API 运行时测试 | `[x]` | `npm run test:api-runtime` | 统一 `src/api` 调用行为 |
| M5 测试云环境集成 | `[ ]` | 待真实环境报告 | 数据库、存储、审核、权限 |
| M6 安全与一致性 | `[ ]` | 待攻击/故障注入报告 | 幂等、隐私、部分成功 |
| M7 性能冒烟 | `[ ]` | 待 k6/Newman 报告 | p95 和超时基线 |
| M8 发布门禁恢复 | `[!]` | `test:release` 资源超限 | 媒体资源约 206.0 KiB / 200 KiB |
| M9 资源外置与本地缓存 | `[~]` | 本地缓存测试通过，待云存储 | 大图/字体按需加载 |
| M10 后端 CLIP 识别 | `[~]` | 云函数、云托管和 token 已部署，待真实图库图片识别 | 云函数 + 云托管模型服务 |

## 环境策略（当前已确认）

- **当前唯一使用环境（测试/预发布）**：`petmon-backend-d0gdzcyjw2d9f70ba`
- **正式生产环境**：尚未创建；上线前必须创建独立环境并重新部署，不复用测试数据库、存储或云托管服务。
- **已作废环境**：`petmon-backend-d0gdzcyjw-da10758`，属于另一个账号，禁止继续使用。
- 测试数据统一使用 `test_`/`e2e_` 前缀和 `runId`，正式数据不得写入当前测试环境。

## 已完成

- [x] 在 `petmon-go-mini/tsconfig.json` 启用 `strict`。
- [x] 启用 `noUncheckedIndexedAccess`、`noImplicitOverride`、`noFallthroughCasesInSwitch`、`forceConsistentCasingInFileNames`。
- [x] 修复上传图片路径可能为空的严格类型错误。
- [x] 修复日期 `split()[0]` 在严格索引检查下可能为 `undefined` 的问题。
- [x] 新增 `petmon-go-mini/tsconfig.tests.json`。
- [x] 新增 API 类型契约测试 `petmon-go-mini/tests/api-types.test.ts`。
- [x] 新增云函数 mock 测试 `petmon-go-mini/tests/cloudfunctions.test.mjs`。
- [x] 将 `test:api-types`、`test:api-runtime`、`test:api-entrypoints` 和 `test:cloudfunctions` 接入 `npm test`。
- [x] 运行云函数测试：8 个场景全部通过。

## 已完成：客户端 API 运行时测试

- [x] 为 `callCloud` mock `wx.cloud` 不存在、成功、异常三条路径。
- [x] 为 `login` 验证成功持久化 `userInfo`，失败返回 `null`。
- [x] 为 `getPets`、`getNotifications` 验证分页参数和返回 envelope。
- [x] 为 `addPet`、`addEncounter`、`addEvent` 验证 ID 解包及错误码处理。
- [x] 确认 `publish`、`report-event` 页面统一使用 `src/api`，并加入入口防回归测试。

阶段检查命令：

```bash
npm run type-check
npm run test:api-types
npm run test:api-runtime
npm run test:api-entrypoints
npm run test:cloudfunctions
```

## 集成测试准备

- [ ] 创建独立微信云开发测试环境，不使用生产环境写入测试数据。
- [ ] 确认测试环境的 `users`、`pets`、`encounters`、`events`、`notices` 数据权限。
- [ ] 准备可重复执行的 fixture 和 `runId` 清理脚本。
- [ ] 准备测试账号、宠物拥有者账号和普通访问账号。
- [ ] 准备合规/违规文本和小于限制的测试图片。
- [ ] 记录云函数部署版本、环境 ID、数据库索引和运行时间。

## 后端 CLIP 集成准备

- [x] 决定推理服务部署形态：使用微信云托管/HTTP 容器。
- [ ] 决定模型：当前默认仓库已有约 85 MiB 量化 ONNX 权重；如要与旧网页严格对齐，再验证 Xenova 权重。
- [x] 为推理服务配置公网 HTTPS、`CLIP_SERVICE_TOKEN` 和健康检查。
- [x] 为服务配置至少 1 个预热实例（最小 1、最大 2）。
- [x] 为 `recognizePet` 云函数配置 `CLIP_INFERENCE_URL`、`CLIP_INFERENCE_TOKEN`。
- [ ] 决定是否保留 `recognizePet` 中间层；如改用 `wx.cloud.callContainer`，需重新验证 token、候选图库和权限边界。
- [ ] 将测试宠物图片上传云存储，并确认 `pets.photos[0]` 为可换临时 URL 的 `fileID`。
- [ ] 确认识别是否要求登录。
- [ ] 确认相似度阈值和无可靠匹配时的 UI 文案。
- [ ] 确认识别图片只临时处理，还是需要保存识别历史。

## 我可以继续直接实现的事项

- [ ] 为所有云函数增加统一参数校验和错误码（`-3/-401/-404/-409/-429`）。
- [ ] 为 `addEncounter` 增加事务或补偿策略，覆盖部分失败回滚。
- [ ] 为登录、建档、相遇增加幂等键和重复提交保护。
- [ ] 将 `petsData/eventsData` 页面数据逐步切换为云函数 API，并保留离线摘要缓存。
- [ ] 编写测试云环境 fixture/清理脚本和集成测试运行器。
- [ ] 编写宠物图片上传、资源清单生成和旧包内图片清理脚本。
- [ ] 在确认模型/阈值后增加识别结果置信度过滤和人工纠正入口。

## P0 集成用例

- [ ] 新用户登录只创建一条用户记录。
- [ ] 老用户登录不重复创建记录。
- [ ] `getPets` 区域过滤、排序和分页正确。
- [ ] 游客无法看到精确轨迹位置。
- [ ] 登录用户的位置可见范围符合确认后的隐私规则。
- [ ] `addPet` 的审核、图片、宠物写入和统计更新一致。
- [ ] `addEncounter` 的四类集合副作用一致。
- [ ] `addEncounter` 宠物不存在时不产生脏记录。
- [ ] `getNotifications` 不能读取其他用户通知。
- [ ] 重复请求的结果符合最终幂等策略。

## 安全与故障注入

- [ ] 未登录调用写接口。
- [ ] 篡改 `_openid`、`status`、`createdAt` 和统计字段。
- [ ] 读取其他用户通知。
- [ ] 非法 `kind`、事件类型、分页和地理坐标。
- [ ] 超长文本和超大 Base64 图片。
- [ ] 审核服务失败、上传失败、数据库各阶段失败。
- [ ] 验证错误响应不泄漏堆栈、完整 openid 或图片内容。
- [ ] 验证并发登录和重复点击不会造成不可接受的数据膨胀。
- [ ] 验证 `recognizePet` 未配置、超时、无图库和推理服务 5xx 时的错误处理。

## 性能与发布

- [ ] 为 `getPets`、`getNotifications` 建立 50 并发基线。
- [ ] 为 `login`、`addPet`、`addEvent` 建立 20 并发基线。
- [ ] 为 `addEncounter` 建立包含审核和上传的 20 并发基线。
- [ ] 记录 p50/p95/p99、错误率、超时和数据库耗时。
- [ ] 调查 `test:release` 的媒体资源超限：约 206.0 KiB > 200 KiB。
- [ ] 修复或批准资源体积门禁后重新运行 `npm test`。
- [ ] 发布前保留完整测试日志和云环境版本信息。

## 资源外置与本地缓存（代码已落地，云资源待配置）

- [x] 保留本地首屏必需的 logo、tabbar 和小图标。
- [x] 新增版本化资源清单 `src/config/pet-photo-resources.ts`。
- [x] 新增远程 URL 解析、本地保存和 fallback 工具 `src/utils/resource-cache.ts`。
- [x] 新增宠物图片适配工具 `src/utils/pet-photo.ts`。
- [x] 首页、探索页、图鉴、详情页接入图片覆盖路径。
- [x] 新增缓存命中、版本失效和网络失败测试 `tests/resource-cache.test.mjs`。
- [x] 小程序构建验证通过：`npm run build:mp-weixin`。
- [x] 新增 `recognizePet` 客户端 API、云函数和 CLIP 推理服务。
- [x] 识别页面从“未接入模型”改为上传、后端匹配和 Top-K 展示。
- [x] 新增 `tests/recognize-cloudfunction.test.mjs`，验证云函数到推理服务的请求契约。
- [x] 新增 `tests/api-runtime.test.mjs` 的识别 API 上传/解包覆盖。
- [x] `python3 -m py_compile backend/clip-service/app.py` 通过。
- [x] 生成微信云 CLIP 流程图：`figures/clip-wechat-cloud-flow.md`、`.mmd`、`.png`。
- [x] 新增无密钥 CloudBase 云托管部署脚本 `scripts/deploy-clip-cloudrun.sh`。
- [ ] 将六张宠物照片上传到测试云存储，建立资源清单和版本号。
- [ ] 增加 `fileID -> HTTPS 临时 URL` 的获取逻辑，并处理 URL 过期。
- [ ] 增加客户端下载/保存/读取缓存工具，缓存键包含资源版本。
- [ ] 首页、探索页和详情页改为可见区域懒加载图片。
- [ ] 评估将 `long-cang.woff2` 改为按需字体加载；验证失败时保留系统字体回退。
- [ ] 将当前 `petsData/eventsData` 硬编码页面逐步切换到 API 数据，并保留离线摘要缓存。
- [ ] 增加缓存命中、失效、清理、弱网和断网测试。
- [ ] 验证资源权限、临时 URL 过期和越权访问。
- [ ] 外置后重新运行 `npm run test:release`，将 M8 从阻断改为通过。
- [x] 验证 CLIP 推理服务 `/healthz`；未授权 `/v1/clip/match` 返回 HTTP 401。
- [ ] 使用真实测试图片验证 `/v1/clip/match` 和端到端 Top-K 结果。
- [ ] 在微信开发者工具/真机完成一次真实识别，确认 Top-K 结果、耗时和失败兜底。
- [ ] 记录预热/冷启动 p50、p95；10 秒目标只作为验收目标，不视为当前已保证。
- [ ] 参考 CloudBase 官方配置：普通云函数 64 MB–3072 MB、超时 1–900 秒；客户端 SDK/同步调用仍需按实际环境验证。

## 待确认决策

- [ ] 锁定错误码：参数错误、未登录、资源不存在、重复提交、限流。
- [ ] 锁定游客与登录用户的地理位置可见范围。
- [ ] 决定 `addEncounter` 的事务/补偿方案。
- [ ] 决定重复相遇记录的幂等窗口。
- [ ] 决定图片大小、MIME 白名单和孤立文件清理策略。
- [ ] 决定是否新增通知已读接口。

## 阶段日志

### 2026-08-29

- 完成严格 TypeScript 配置和两个索引安全修复。
- 完成 API 类型契约测试。
- 完成客户端 API 运行时 mock 测试。
- 完成页面 API 入口统一和防回归静态测试。
- 完成云函数 mock 测试，8/8 通过。
- `npm run type-check`：通过。
- `npm run test:api-types`：通过。
- `npm run test:api-runtime`：通过。
- `npm run test:api-entrypoints`：通过。
- `npm run test:cloudfunctions`：通过。
- `npm run test:resource-cache`：通过。
- `npm run build:mp-weixin`：通过。
- `npm run test:recognize-cloud`：通过。
- `npm test`：在既有 `test:release` 阶段失败，原因是媒体资源总量 205.6 KiB 超过 200 KiB 门禁；API 相关测试已通过独立命令验证。

### 2026-08-29（资源缓存阶段）

- 新增版本化宠物图片资源清单，未填充虚假的云存储 ID。
- 新增云存储临时 URL、下载、持久化保存、缓存命中、版本失效和 fallback 工具。
- 首页、探索、图鉴、宠物详情接入图片覆盖路径；没有远程资源时保持原本地图片。
- 新增 `npm run test:resource-cache`，通过。
- `npm run build:mp-weixin`，通过。
- 回归 `npm run type-check`、`npm run test:api-types`、`npm run test:api-runtime`、`npm run test:api-entrypoints`、`npm run test:cloudfunctions`，全部通过。
- `npm test` 仍在最后的 `test:release` 因媒体资源 205.6 KiB > 200 KiB 失败；必须上传远程照片并移除包内原图后才能验证门禁恢复。

### 2026-08-30（CLIP 后端接入阶段）

- 确认原识别页只有占位文案，没有调用模型或后端接口。
- 新增 `recognizePet` 云函数：整理输入/图库临时 URL、调用微信云托管推理服务、过滤 Top-K、清理临时上传。
- 新增 `backend/clip-service` FastAPI + ONNX Runtime CLIP 服务和 Dockerfile。
- 识别页改为真实上传、后端匹配、结果展示和错误状态。
- `npm run test:recognize-cloud`、`npm run test:api-runtime`、`npm run type-check` 和 Python 语法检查通过。
- 已部署 `recognizePet` 云函数，但尚未配置真实推理服务、云存储图库和 CLIP 环境变量，不能声称真机识别已验证。
- CloudBase 浏览器控制台仍需用户登录；CLI 已恢复授权，未尝试密码或绕过登录。

### 2026-08-30（CloudBase 部署尝试与完成）

- 更新后的 CloudBase CLI 授权有效，可读取环境和函数配置。
- 读取到环境 `petmon-backend-d0gdzcyjw2d9f70ba`，套餐为个人版，状态 `NORMAL`。
- 初次尝试创建 `petmon-clip` 时返回 `CreateCloudRunServer: 云托管资源未开通`；用户随后在控制台开通云托管能力。
- 云托管开通后创建成功，发布版本 `petmon-clip-001`，随后发布版本 `petmon-clip-002` 使环境变量生效，并切换 100% 流量。
- 未执行套餐升级或计费开通；服务创建/运行可能产生按量费用，需在 CloudBase 控制台核对。
- 使用临时部署配置成功部署 `recognizePet`：`lam-obt60twp`，Nodejs20.19、512 MB、60 秒。
- 真实空参数 smoke invoke 成功：4 ms 返回 `{"code":-3,"message":"缺少待识别图片"}`。
- `petmon-clip` `/healthz` 返回正常；无 token 的 `/v1/clip/match` 返回 HTTP 401。
- `recognizePet` 已配置 `CLIP_INFERENCE_URL` 和 `CLIP_INFERENCE_TOKEN`，secret 未写入仓库。
- 配置后再次用不存在图片调用 `recognizePet`，返回 `-404 图片临时链接不可用`，确认已不再走 `-503 未配置服务` fallback。
- 核对官方成长计划页面：成长计划提供个人版云开发环境/AI 资源包，代金券仅说明为云开发产品使用；未看到 CloudRun 计算额度承诺。

### 2026-08-30（develop 更新后回归）

- `npm test` 的 API、识别和云函数测试均通过。
- `test:release` 仍失败，当前报告约 206.0 KiB > 200 KiB；最新 develop 增加的发布图标也计入门禁，需与资源外置一起处理。

## 下一检查点

配置独立微信云开发测试环境、CLIP 推理服务和图库 fixture 后，进入 M5/M10 P0 集成用例；本地阶段回归命令如下：

```bash
npm run type-check && npm run test:api-types && npm run test:api-runtime && npm run test:api-entrypoints && npm run test:resource-cache && npm run test:cloudfunctions && npm run test:recognize-cloud
```

之后开始 M5 集成测试，并记录环境 ID、部署版本和清理结果。
