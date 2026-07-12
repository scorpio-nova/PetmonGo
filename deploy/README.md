# 部署说明（阿里云服务器 + 二级域名自动更新）

目标：`https://petmongo.softlanding.com.cn/` 对外访问，`main` 分支每次 push 后 1 分钟内自动上线。
方式：服务器每分钟轮询 GitHub，有更新才 `git pull` 重新部署（纯静态站，无后端）。

## 前置

1. **仓库需可被服务器拉取**：设为 Public（评审也需要），HTTPS clone 免鉴权即可。
   若坚持私有，去 GitHub 仓库 Settings → Deploy keys 加一把只读部署公钥，clone 用 SSH 地址。
2. **DNS**：确认 `petmongo.softlanding.com.cn` 的 A 记录指向服务器**公网 IP**。

## 一次性安装（在服务器上执行）

```bash
# 1) 建目录并 clone
sudo mkdir -p /var/www/petmon-go
sudo chown "$USER":"$USER" /var/www/petmon-go
cd /var/www/petmon-go
git clone https://github.com/scorpio-nova/PetmonGo.git repo

# 2) 首次生成入口 index.html
cp -f "repo/project/petmon go.dc.html" repo/project/index.html
chmod +x repo/deploy/deploy.sh

# 3) 配 nginx
sudo cp repo/deploy/nginx.conf.example /etc/nginx/conf.d/petmongo.conf
sudo nginx -t && sudo systemctl reload nginx

# 4) 建日志文件
sudo touch /var/log/petmon-deploy.log
sudo chown "$USER":"$USER" /var/log/petmon-deploy.log
```

打开 `http://petmongo.softlanding.com.cn/` 应能看到页面。

## 开启每分钟自动部署（cron）

```bash
crontab -e
```

加入一行（`flock` 防止上一次没跑完就重叠执行）：

```
* * * * * /usr/bin/flock -n /tmp/petmon-deploy.lock /var/www/petmon-go/repo/deploy/deploy.sh >> /var/log/petmon-deploy.log 2>&1
```

验证：`tail -f /var/log/petmon-deploy.log`，push 一次代码后一分钟内会看到 `deployed xxxxxxx -> yyyyyyy`。

> 想更即时/更规范可改用 systemd timer（`OnUnitActiveSec=1min`），逻辑一样，cron 已足够。

## HTTPS（建议）

```bash
sudo yum install -y certbot python3-certbot-nginx   # 或 apt
sudo certbot --nginx -d petmongo.softlanding.com.cn
```

certbot 会自动改写上面的 nginx 配置并配好自动续期。之后把 `nginx.conf.example` 里 80→443 的跳转注释打开。

## 仍待处理：识别功能的模型自托管

当前识别用的 CLIP 模型从 jsdelivr + huggingface.co 下载，**国内直连 huggingface 不通**，观众用识别会报错。
需要把模型（`vision_model_quantized.onnx` ~85MB）、onnxruntime 的 `.wasm`、`transformers.js` 一并放到本服务器，
并把 `pet-match.js` 里的 CDN 地址改成本站相对路径 + 设置 `env.localModelPath`。
nginx 配置里的 `.wasm/.onnx` MIME 已经预留好。这块单独做，告诉我即可。
