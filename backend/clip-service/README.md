# Petmon CLIP 推理服务

这是 `petmon-go-mini/cloudfunctions/recognizePet` 调用的独立模型服务。模型不打进小程序包，也不打进微信云函数包。默认使用仓库已有的量化 ONNX 视觉模型，文件大小约 85 MiB。

## API

健康检查：

```text
GET /healthz
```

识别：

```json
POST /v1/clip/match
X-Clip-Service-Token: <optional-token>

{
  "imageUrl": "https://signed-input-image-url",
  "candidates": [
    {"petId": "pet-001", "imageUrl": "https://signed-gallery-image-url"}
  ],
  "topK": 3
}
```

返回：

```json
{
  "model": "openai/clip-vit-base-patch32",
  "matches": [
    {"petId": "pet-001", "score": 0.91}
  ]
}
```

## 本地启动

需要 Python 3.11 和可用的 CPU/GPU 环境：

```bash
cd backend/clip-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
CLIP_SERVICE_TOKEN=dev-token .venv/bin/uvicorn app:app --host 0.0.0.0 --port 8080
```

默认模型文件来自仓库的 `project/models/Xenova/clip-vit-base-patch32/onnx/vision_model_quantized.onnx`，启动时无需下载模型。生产环境建议使用预热实例；CPU 模式下通过候选向量缓存降低重复请求耗时。该 ONNX 文件由 Xenova CLIP 视觉塔导出，输入预处理与仓库旧网页的视觉模型配置保持一致。

仓库根目录构建（使用完整路径 Dockerfile）：

```bash
docker build -f backend/clip-service/Dockerfile -t petmon-clip:onnx .
```

部署脚本使用 `Dockerfile.cloudrun`，其上下文是精简的临时目录，只包含服务代码、依赖、模型和一个 Dockerfile。

开通 CloudBase 云托管后，从仓库根目录运行：

```bash
bash scripts/deploy-clip-cloudrun.sh
```

脚本只会把服务代码、Dockerfile 和 85 MiB 模型复制到临时 staging 目录，不会复制项目密钥或整个小程序工程。可以通过 `CLOUDBASE_ENV_ID` 和 `CLOUDBASE_CLIP_SERVICE_NAME` 覆盖默认环境/服务名。

## 云函数配置

在微信云函数 `recognizePet` 的环境变量中设置：

```text
CLIP_INFERENCE_URL=https://<your-service-domain>/v1/clip/match
CLIP_INFERENCE_TOKEN=dev-token
```

推理服务设置同样的 `CLIP_SERVICE_TOKEN`。不要把 token 写入小程序前端代码。

## 部署选择

需要人工选择一个可被微信云函数访问的 HTTPS 服务：微信云托管/容器服务、自有 GPU 服务器、Cloud Run、Modal 等均可。若服务只在内网，云函数需要配置同一 VPC 或公网 HTTPS。对于 10 秒目标，建议保持至少一个预热实例，避免模型冷启动。容器会读取平台提供的 `PORT` 环境变量，默认端口为 8080。
