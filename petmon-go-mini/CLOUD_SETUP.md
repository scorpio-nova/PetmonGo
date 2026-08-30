# 微信云开发配置指南

> 当前文档只针对测试/预发布环境 `petmon-backend-d0gdzcyjw2d9f70ba`。正式上线时必须创建独立生产环境，不能直接复用测试数据。

## 一、开通云开发

### 步骤
1. 在微信开发者工具中打开项目
2. 点击左上角「云开发」按钮
3. 点击「开通」
4. 选择「免费额度」套餐
5. 等待环境创建完成

### 记录环境ID
开通后会得到一个环境ID，格式类似：`petmon-go-xxx`

---

## 二、配置环境ID

### 修改 App.vue
打开 `src/App.vue`，找到云初始化代码，替换环境ID：

```javascript
wx.cloud.init({
  env: 'petmon-go-xxx', // 替换为你的环境ID
  traceUser: true
});
```

---

## 三、创建数据库集合

在云开发控制台 → 数据库，创建以下集合：

| 集合名 | 说明 |
|--------|------|
| users | 用户表 |
| pets | 宠物表 |
| encounters | 相遇记录表 |
| events | 安全事件表 |
| notices | 通知表 |

### 设置权限
每个集合的权限设置为：**仅创建者可读写** 或 **所有用户可读，仅创建者可写**

---

## 四、部署云函数

### 方法一：手动部署
1. 在微信开发者工具中，右键点击 `cloudfunctions` 目录下的云函数文件夹
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

### 方法二：批量部署
```bash
# 进入每个云函数目录，安装依赖
cd cloudfunctions/login && npm install
cd cloudfunctions/getPets && npm install
cd cloudfunctions/addPet && npm install
cd cloudfunctions/addEncounter && npm install
cd cloudfunctions/addEvent && npm install
cd cloudfunctions/getNotifications && npm install
cd cloudfunctions/recognizePet && npm install
```

然后在微信开发者工具中逐个上传部署。

---

## 五、配置内容安全

在云开发控制台 → 设置 → 内容安全：
1. 开启「图片内容安全」
2. 开启「文本内容安全」

---

## 六、测试云函数

在微信开发者工具中：
1. 右键点击云函数 → 「在终端中调用」
2. 输入测试参数
3. 查看返回结果

---

## 七、注意事项

1. **环境ID**：每个云开发环境有独立的ID，不要搞混
2. **云函数依赖**：部署时选择「云端安装依赖」，自动安装 node_modules
3. **内容安全**：图片和文字审核需要在云开发控制台开启
4. **权限控制**：数据库权限要正确设置，否则会出现权限错误

---

## 八、常见问题

### Q: 云函数调用失败
A: 检查环境ID是否正确，云函数是否部署成功

### Q: 数据库权限错误
A: 检查集合权限设置，确保用户有读写权限

### Q: 内容审核不通过
A: 检查是否在云开发控制台开启了内容安全功能

## 九、宠物图片远程加载与本地缓存

小程序已经支持“云存储资源 + 客户端本地缓存 + 本地 fallback”。代码位置：

- `src/config/pet-photo-resources.ts`：宠物图片资源清单
- `src/utils/resource-cache.ts`：临时 URL、下载、保存和版本化缓存
- `src/utils/pet-photo.ts`：页面图片适配

当前清单中的 `fileId` 为空，页面会继续使用 `src/static/pets` 中的本地图片。配置真实云资源时：

1. 在**测试云环境**上传六张宠物照片，例如 `pet-assets/v1/cat1.jpg`。
2. 记录每个文件返回的 `fileID`。
3. 将 `src/config/pet-photo-resources.ts` 中对应项改为：

   ```ts
   cat1: {
     version: 'v1',
     fileId: 'cloud://<env-id>....',
     fallback: '/static/pets/catt-1.jpg'
   }
   ```

4. 在微信公众平台配置下载合法域名；云开发临时 URL 必须使用 HTTPS。
5. 重新编译并在开发者工具/真机验证首次下载、缓存命中、断网 fallback 和版本升级。
6. 确认无误后再把同一版本资源上传到生产环境，并使用生产环境的 `fileID`。

不要把管理密钥、云 API 密钥或长期有效签名下发到客户端。资源文件名和 `fileID` 可以进入前端清单，访问权限仍由云存储规则控制。

## 十、接入后端 CLIP 识别

识别功能由微信云托管中的推理服务承载，微信云函数只做临时文件 URL、宠物图库整理和结果转发。推理服务代码位于仓库的 `backend/clip-service/`。

部署步骤：

1. 在可被微信云函数访问的 HTTPS 主机部署 `backend/clip-service`。
2. 设置推理服务环境变量 `CLIP_SERVICE_TOKEN`，并确认 `GET /healthz` 正常。
3. 在微信云函数 `recognizePet` 的环境变量中设置：

   ```text
   CLIP_INFERENCE_URL=https://<service-domain>/v1/clip/match
   CLIP_INFERENCE_TOKEN=<same-token>
   ```

4. 将宠物图库照片上传到测试云存储，并确保 `pets.photos[0]` 是可换取临时 URL 的 `fileID`。
5. 在 `recognize` 页面选择照片，确认出现“CLIP 正在匹配”和 Top-K 结果。
6. 检查识别结束后 `recognitions/` 临时输入文件已清理，失败时显示可理解的错误和本地预览。

推理服务默认使用仓库中的 `vision_model_quantized.onnx`（约 85 MiB），可以通过 `CLIP_ONNX_MODEL_PATH` 替换模型文件，并用 `CLIP_MODEL_ID` 设置返回的模型标识。模型选择、是否要求登录、相似度阈值和数据保留策略需要产品确认后再锁定。

当前环境的 `recognizePet` 云函数和 `petmon-clip` 云托管服务均已部署。服务域名和运行规格记录在仓库 `TODO.md`；环境变量已在 CloudBase 控制台配置，不要把 token 写入代码或仓库。
