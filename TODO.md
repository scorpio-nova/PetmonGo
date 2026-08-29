# Petmon Go 测试计划 TODO

> 对应方案：[`docs/api-backend-testing-plan.md`](docs/api-backend-testing-plan.md)
> 负责人：待分配
> 当前阶段：本地测试与缓存代码已完成，等待测试云存储资源配置
> 最后更新：2026-08-29

## 状态说明

- `[x]` 已完成并有命令或文件证据
- `[~]` 部分完成，仍有明确剩余项
- `[ ]` 未开始
- `[!]` 被问题阻断，但已有下一步

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
| M8 发布门禁恢复 | `[!]` | `test:release` 资源超限 | 媒体资源 205.6 KiB / 200 KiB |
| M9 资源外置与本地缓存 | `[~]` | 本地缓存测试通过，待云存储 | 大图/字体按需加载 |

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

## 性能与发布

- [ ] 为 `getPets`、`getNotifications` 建立 50 并发基线。
- [ ] 为 `login`、`addPet`、`addEvent` 建立 20 并发基线。
- [ ] 为 `addEncounter` 建立包含审核和上传的 20 并发基线。
- [ ] 记录 p50/p95/p99、错误率、超时和数据库耗时。
- [ ] 调查 `test:release` 的媒体资源超限：205.6 KiB > 200 KiB。
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
- [ ] 将六张宠物照片上传到测试云存储，建立资源清单和版本号。
- [ ] 增加 `fileID -> HTTPS 临时 URL` 的获取逻辑，并处理 URL 过期。
- [ ] 增加客户端下载/保存/读取缓存工具，缓存键包含资源版本。
- [ ] 首页、探索页和详情页改为可见区域懒加载图片。
- [ ] 评估将 `long-cang.woff2` 改为按需字体加载；验证失败时保留系统字体回退。
- [ ] 将当前 `petsData/eventsData` 硬编码页面逐步切换到 API 数据，并保留离线摘要缓存。
- [ ] 增加缓存命中、失效、清理、弱网和断网测试。
- [ ] 验证资源权限、临时 URL 过期和越权访问。
- [ ] 外置后重新运行 `npm run test:release`，将 M8 从阻断改为通过。

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
- `npm test`：在既有 `test:release` 阶段失败，原因是媒体资源总量 205.6 KiB 超过 200 KiB 门禁；API 相关测试已通过独立命令验证。

### 2026-08-29（资源缓存阶段）

- 新增版本化宠物图片资源清单，未填充虚假的云存储 ID。
- 新增云存储临时 URL、下载、持久化保存、缓存命中、版本失效和 fallback 工具。
- 首页、探索、图鉴、宠物详情接入图片覆盖路径；没有远程资源时保持原本地图片。
- 新增 `npm run test:resource-cache`，通过。
- `npm run build:mp-weixin`，通过。
- 回归 `npm run type-check`、`npm run test:api-types`、`npm run test:api-runtime`、`npm run test:api-entrypoints`、`npm run test:cloudfunctions`，全部通过。
- `npm test` 仍在最后的 `test:release` 因媒体资源 205.6 KiB > 200 KiB 失败；必须上传远程照片并移除包内原图后才能验证门禁恢复。

## 下一检查点

配置独立微信云开发测试环境并完成 fixture 后，进入 M5 P0 集成用例；本地阶段回归命令如下：

```bash
npm run type-check && npm run test:api-types && npm run test:api-runtime && npm run test:api-entrypoints && npm run test:cloudfunctions
```

之后开始 M5 集成测试，并记录环境 ID、部署版本和清理结果。
