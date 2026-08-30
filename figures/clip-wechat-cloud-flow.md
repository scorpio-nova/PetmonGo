# 微信云 CLIP 识别流程

该图按执行顺序标注每一步所在位置、传递的数据以及本地缓存和图库向量缓存的作用。当前代码已实现小程序 API、`recognizePet` 云函数和量化 ONNX 推理服务；真实部署还需要配置微信云托管地址、环境变量和测试图库。

```mermaid
flowchart TD
    subgraph MINI[微信小程序端]
        A[用户选择或拍摄照片]
        B[本地展示预览]
        C[wx.cloud.uploadFile<br/>recognitions/临时文件]
        D[wx.cloud.callFunction<br/>recognizePet API]
        A --> B --> C --> D
    end

    subgraph CLOUD[微信云开发环境]
        E[recognizePet 云函数<br/>参数校验与权限检查]
        F[cloud.getTempFileURL<br/>获取输入图片 URL]
        G[查询 pets 图库<br/>最多 100 个候选]
        H[cloud.getTempFileURL<br/>获取候选图片 URL]
        I[HTTP POST 到 CLIP 服务<br/>输入图 + 候选图 + topK]
        J[过滤非法 petId/score<br/>补充名称和中文名]
        K[删除 recognitions/临时文件]
        E --> F
        E --> G --> H
        F --> I
        H --> I
        I --> J --> K
    end

    subgraph AI[微信云托管/HTTP 容器中的 CLIP 服务]
        L[FastAPI /v1/clip/match<br/>校验服务 token]
        M[加载量化 ONNX 视觉模型<br/>89,117,001 bytes ≈ 85 MiB]
        N[预处理输入图<br/>RGB / resize / normalize]
        O{候选向量缓存命中?}
        P[复用 petId + fileID 向量]
        Q[编码候选宠物图片<br/>并写入缓存]
        R[余弦相似度排序<br/>返回 Top-K petId/score]
        L --> M --> N --> O
        O -->|是| P --> R
        O -->|否| Q --> R
    end

    D --> E
    I --> L
    R -. JSON matches .-> I
    K --> D
    D --> S[小程序显示匹配结果<br/>或错误/重试]

    classDef mini fill:#fff8e2,stroke:#d9a441,color:#302817,stroke-width:1px
    classDef cloud fill:#eaf4ff,stroke:#4c8dca,color:#172a3a,stroke-width:1px
    classDef ai fill:#eff9ed,stroke:#5b9b58,color:#183418,stroke-width:1px
    class A,B,C,D,S mini
    class E,F,G,H,I,J,K cloud
    class L,M,N,O,P,Q,R ai
```

## 图中关键边界

- 小程序只负责选图、上传、调用云函数和展示结果，不持有 CLIP 模型或服务 token。
- 微信云函数负责权限、临时 URL、图库候选整理、结果过滤和临时文件清理。
- 微信云托管/HTTP 容器负责模型加载、图片编码和相似度计算；模型不会进入小程序包。
- 第一次请求可能触发模型冷启动；预热实例和图库向量缓存是 10 秒目标的关键。
