# Petmon Go Mini：API 与后端测试方案

> 状态：执行中
> 适用代码：`petmon-go-mini` 维护清单：[`../TODO.md`](../TODO.md)
> 最近验证：2026-08-29（本地 mock 与类型检查）

## 1. 文档边界与事实来源

本方案针对当前微信小程序实现，而不是根目录 README 和早期纯静态站架构。接口事实来源如下：

- 客户端调用封装：`petmon-go-mini/src/utils/cloud.ts`
- 客户端 API 类型及函数：`petmon-go-mini/src/api/*.ts`
- 云函数实现：`petmon-go-mini/cloudfunctions/*/index.js`
- 本地测试入口：`petmon-go-mini/package.json`

当前云函数统一使用如下返回 envelope：

```ts
{
  code: number
  data?: unknown
  message?: string
}
```

当前已观察到的错误码为：`0` 成功、`-1` 异常、`-2` 内容审核不通过。参数校验、未登录、资源不存在、重复提交等错误码尚未在实现中统一，见“待决策与风险”。

## 2. 接口清单与测试重点

| 接口 | 输入 | 成功结果 | 关键副作用/风险 | 测试优先级 |
|---|---|---|---|---|
| `login` | 无 | `userInfo`, `isNewUser` | 创建或查询 `users`；并发首次登录可能重复创建 | P0 |
| `getPets` | `area?`, `page?`, `pageSize?` | 宠物分页列表 | 游客/登录用户轨迹位置脱敏规则 | P0 |
| `addPet` | `name`, `kind`, `breed`, `tag`, `area`, 其余可选 | `petId` | 审核、图片上传、宠物写入、用户统计更新 | P0 |
| `addEncounter` | `petId`, `photo?`, `note?` | `encounterId` | 审核、上传、四类集合写入；非原子一致性 | P0 |
| `addEvent` | `type`, `title`, `place`, 其余可选 | `eventId` | 标题/描述审核，事件写入 | P1 |
| `getNotifications` | `page?`, `pageSize?` | 通知分页列表 | 只能读取当前用户通知 | P0 |

## 3. 测试分层与当前实现

### 3.1 类型与静态门禁（已落地）

`petmon-go-mini/tsconfig.json` 已启用：

- `strict`
- `noUncheckedIndexedAccess`
- `noImplicitOverride`
- `noFallthroughCasesInSwitch`
- `forceConsistentCasingInFileNames`

API 类型契约测试位于 `petmon-go-mini/tests/api-types.test.ts`，通过 `@ts-expect-error` 固定非法 `kind`、事件类型和分页参数不能编译通过。

### 3.2 客户端 API 层

目标是验证 `callCloud` 和 `src/api` 是否正确传参、解包和处理错误：

- `wx.cloud` 不可用时返回 `code=-1`
- 云函数异常转换为统一错误 envelope
- 成功时返回 `petId`、`encounterId`、`eventId`
- 非零错误码不被包装成成功
- `login` 成功后持久化 `userInfo`
- 默认分页参数与显式分页参数传递正确

类型契约、运行时客户端 API mock 和页面 API 入口防回归测试均已落地。运行时测试位于 `petmon-go-mini/tests/api-runtime.test.mjs`，覆盖云开发未初始化、调用成功、网络异常、各 API 参数传递、成功 ID 解包和非零错误码转换；入口测试位于 `petmon-go-mini/tests/api-entrypoints.test.mjs`，确保页面不直接调用 `wx.cloud.callFunction`。

### 3.3 云函数单元测试（已落地）

`petmon-go-mini/tests/cloudfunctions.test.mjs` 使用 Node 原生断言和 `wx-server-sdk` mock，不访问真实微信环境。当前覆盖 8 个场景：

1. 新用户登录创建用户
2. 老用户登录不重复插入
3. 游客获取宠物时隐藏精确轨迹位置
4. 新增宠物、上传照片并更新统计
5. 宠物名称审核失败时不写入
6. 新增相遇及相关集合副作用
7. 事件标题审核失败时不写入
8. 通知分页返回结构

### 3.4 测试云环境集成测试（待执行）

需要独立微信云环境，不得对生产环境执行写入型测试。每次运行使用唯一 `runId`，fixture 和清理都按 `runId` 隔离。

必须验证：

- 真实数据库分页、排序和索引
- 真实云存储上传与审核接口
- `addEncounter` 多集合写入的部分失败行为
- 用户通知隔离和位置隐私
- 并发登录与重复提交
- 微信开发者工具/真机关键链路

## 4. 详细用例矩阵

### `login`

| 用例 | 预期 |
|---|---|
| 新 openid | 创建一条用户，`isNewUser=true`，统计字段初始化为 0 |
| 已有 openid | 不新增记录，`isNewUser=false`，返回原用户 |
| 空 openid | 应按最终错误码契约拒绝（当前实现待补） |
| 查询失败 | `code=-1`，不返回内部堆栈 |
| 两次并发首次登录 | 最多一条用户记录，需唯一约束或幂等实现 |

### `getPets`

| 用例 | 预期 |
|---|---|
| 默认参数 | 第 1 页、默认 20 条 |
| `area` 过滤 | `total` 和列表只对应目标区域 |
| 最后一页 | 列表数量不超过 `pageSize` |
| 超出页数 | 空列表，分页 envelope 保持完整 |
| 游客 | 不返回轨迹精确 `location` |
| 登录用户 | 仅按确认后的隐私规则返回位置 |
| 非法分页 | 拒绝或归一化，行为需固定 |

### `addPet`

| 用例 | 预期 |
|---|---|
| 必填字段完整 | 写入宠物，默认 `cnName=name`、`stars=3`、`seen=1` |
| 无图片 | `photos=[]` |
| 有图片 | 上传成功后保存 `fileID` |
| 名称/描述违规 | 返回 `-2`，不写数据库 |
| 图片上传失败 | 不返回成功；检查孤立文件处理 |
| 用户统计更新失败 | 不允许静默半成功，需事务或补偿策略 |

### `addEncounter`

| 用例 | 预期 |
|---|---|
| 仅 `petId` | 默认备注为“偶遇” |
| 含照片 | 审核、上传并保存照片 ID |
| 宠物不存在 | 返回资源不存在错误，不创建相遇 |
| 备注/图片违规 | 返回 `-2`，不产生业务写入 |
| 全链路成功 | encounters、pets、users、notices 均产生预期变化 |
| 中途数据库失败 | 不留下不可恢复的部分成功；需事务/补偿验证 |
| 重复点击 | 幂等键或明确允许重复，行为需固定 |

### `addEvent`

| 用例 | 预期 |
|---|---|
| 四种合法 `type` | 均可创建事件 |
| 缺少标题/地点 | 拒绝请求 |
| 非法 `type` | 拒绝请求 |
| 标题/描述违规 | 返回 `-2`，不写入 |
| 客户端传入 `_openid/status` | 服务端忽略并使用可信上下文/默认值 |

### `getNotifications`

| 用例 | 预期 |
|---|---|
| 默认分页 | 第 1 页、20 条 |
| 显式分页 | 返回请求中的合法 `page/pageSize` |
| 用户隔离 | 只能看到当前 openid 的通知 |
| 越界分页 | 空列表但 envelope 完整 |
| 超大 pageSize | 拒绝或限制最大值 |
| 数据库异常 | `code=-1`，不泄漏实现细节 |

## 5. 测试数据与环境

### 本地单元测试

- 不需要网络和微信凭证。
- `wx-server-sdk`、数据库链式 API、审核 API、上传 API 均由 mock 提供。
- 测试必须保持确定性，不依赖真实时间、随机 ID 或外部数据。

### 集成测试云环境

建议使用专用环境（例如 `petmon-backend-test`）：

```text
用户：e2e_${runId}_user
宠物：e2e_${runId}_pet
事件：e2e_${runId}_event
```

测试结束后按 `runId` 删除 fixture；清理失败必须使任务失败并报警。

## 6. 运行命令与验收门禁

在 `petmon-go-mini` 目录执行：

```bash
npm run type-check
npm run test:api-types
npm run test:api-runtime
npm run test:api-entrypoints
npm run test:resource-cache
npm run test:cloudfunctions
npm run build:mp-weixin
npm test
```

PR 门禁：

- `type-check` 必须通过
- API 类型契约测试必须通过
- API 运行时 mock 测试必须通过
- API 入口防回归测试必须通过
- 云函数单元测试必须通过
- P0 用例不能失败
- API 返回 envelope 发生变化时必须同步更新本文档和契约测试

当前 `npm test` 还包含已有的 `test:release`。2026-08-29 的基线运行在该步骤因打包媒体资源为 205.6 KiB、超过 200 KiB 限制而失败；这不是本次 API 测试改动引入的问题，应单独在 TODO 中跟踪。

## 7. 待决策与风险

以下项目不能仅靠本地 mock 推断，需产品/后端确认后再锁定断言：

1. 游客是否允许调用所有读接口，以及登录用户能看到的精确位置范围。
2. 缺少参数、未登录、资源不存在、重复提交分别使用什么错误码。
3. `addEncounter` 是否允许同一用户短时间内重复记录。
4. 多集合写入采用数据库事务、补偿操作还是接受最终一致性。
5. 图片最大字节数、MIME 白名单、审核失败后的存储清理策略。
6. `getNotifications` 是否需要配套的已读/批量已读 API。

这些决策确认后，应先更新 API 契约，再补单测和集成测试，避免测试固化错误行为。

## 8. 进度维护规则

- 每完成一个阶段，在 [`TODO.md`](../TODO.md) 勾选对应项并记录日期、命令和结果。
- 每次失败都记录“失败步骤、可复现命令、是否为基线问题、下一步负责人”。
- 阶段检查点固定为：类型检查 → 本地单测 → 集成测试 → 安全测试 → 性能冒烟 → 发布门禁。
- 只有真实云环境验证完成且所有 P0 用例通过，才能将本方案标记为“完成”。

## 9. 资源加载与本地缓存建议

### 9.1 当前限制的性质

`petmon-go-mini/tests/release-readiness.test.mjs` 第 39–46 行扫描编译产物 `dist/build/mp-weixin` 中的图片、音频和 SVG，并设置了 **200 KiB 的项目自定义前端门禁**。它不是云函数或数据库限制，也不是后端响应体限制。

2026-08-29 当前构建的精确统计为：

| 资源组 | 大小 |
|---|---:|
| `static/pets` 六张宠物照片 | 183,897 bytes |
| `static/icons` | 14,051 bytes |
| `static/tabbar` | 8,514 bytes |
| `static/logo.png` | 4,023 bytes |
| 合计（门禁统计范围） | 210,485 bytes / 205.6 KiB |

字体文件（当前约 262 KiB）不在该门禁的扩展名集合中，但仍会增加小程序包体积。

### 9.2 推荐策略：关键资源本地 + 大资源远程懒加载 + 本地缓存

可以做，而且建议采用混合方案：

1. **保留本地**：首屏必须显示的 logo、tabbar、猫狗小图标、空状态图标。它们体积小、离线可用、不会阻塞首屏。
2. **移到云存储/CDN**：六张宠物照片、较大的字体、后续用户上传照片。云函数只返回资源标识或 HTTPS 临时 URL，不建议让云函数代理二进制内容。
3. **按需下载**：进入首页/探索页只请求当前可见照片；详情页打开时再请求详情图；字体在首次需要手绘字体时加载。
4. **本地缓存**：以 `资源版本 + URL/fileID` 生成缓存键。缓存命中直接使用本地文件路径；未命中时下载后保存到用户文件系统。
5. **过期与兜底**：远程 URL 失效时重新换取临时 URL；下载失败显示本地占位图，不影响列表和其他接口。
6. **版本清理**：资源清单版本变化时删除旧版本，限制缓存总量，避免长期占满用户空间。

### 9.3 哪些内容适合移到后端

| 内容 | 建议 | 原因 |
|---|---|---|
| 宠物照片/用户上传图片 | 适合 | 已有云存储上传逻辑，可返回 `fileID`/临时 URL |
| 宠物、事件、通知 JSON | 适合 | 当前部分页面仍使用 `petsData/eventsData` 硬编码，应逐步改为 API 数据并缓存摘要 |
| 字体 | 可选 | 能减小包体，但首次加载慢、需要合法下载域名和字体加载兼容性验证 |
| SVG 小图标、tabbar 图标 | 不建议优先移动 | 体积小且首屏依赖，远程请求会增加白屏/失败风险 |
| Vue/JS 页面代码 | 不能按普通资源移出 | 小程序页面代码需要随包编译，不能由云函数动态替换执行 |

### 9.4 微信云开发落地方式

推荐资源链路：

```text
云存储 fileID
  -> getTempFileURL / 受控 HTTPS URL
  -> 客户端 downloadFile
  -> saveFile / 用户文件缓存
  -> <image src="本地缓存路径或远程 URL">
```

必须同步配置：下载合法域名、HTTPS、临时 URL 过期刷新、缓存清理和图片失败占位。不要把长期有效的云存储密钥或管理凭证下发到客户端。

### 9.5 对测试的影响

资源外置后需要新增：

- 首次下载成功/失败和占位图测试
- 缓存命中、缓存失效、版本升级清理测试
- 弱网、断网、临时 URL 过期测试
- 云存储权限和越权读取测试
- 首屏不依赖远程资源的回归测试
- 重新运行 `test:release`，确认包内媒体低于 200 KiB

当前已落地的资源加载代码：

- 资源清单：`petmon-go-mini/src/config/pet-photo-resources.ts`
- 缓存解析：`petmon-go-mini/src/utils/resource-cache.ts`
- 宠物图片适配：`petmon-go-mini/src/utils/pet-photo.ts`
- 页面接入：首页、探索、图鉴、宠物详情
- 本地验证：`npm run test:resource-cache`，覆盖 fallback、下载、保存、缓存命中、版本失效和网络失败

当前清单中的 `fileId` 为空，因此当前运行仍使用本地 fallback；上传到微信云存储并填写真实 `fileId` 后才会启用远程下载。`npm run build:mp-weixin` 已验证页面接入可正常编译。
