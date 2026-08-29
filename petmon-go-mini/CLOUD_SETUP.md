# 微信云开发配置指南

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
