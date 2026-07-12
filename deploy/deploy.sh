#!/usr/bin/env bash
# Petmon Go 自动部署脚本
# 逻辑:git fetch 比对本地/远端 commit,不一致才 pull + 刷新入口,一致则原地退出。
# 由 cron 每分钟调用(见 deploy/README 里的 crontab 示例)。纯静态站,直接从工作区提供服务。
set -euo pipefail

# cron 的 PATH 很精简,显式补上,避免找不到 git
export PATH=/usr/local/bin:/usr/bin:/bin

REPO_DIR="${PETMON_REPO_DIR:-/var/www/petmon-go/repo}"   # 仓库 clone 到哪
BRANCH="${PETMON_BRANCH:-main}"
LOG="${PETMON_LOG:-/var/log/petmon-deploy.log}"

cd "$REPO_DIR"

git fetch --quiet origin "$BRANCH"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

# 没有更新:安静退出,维持现状
[ "$LOCAL" = "$REMOTE" ] && exit 0

# 有更新:强制对齐远端(静态站,以远端为准最省心)
git reset --hard "origin/$BRANCH"

# 入口文件名带空格,不适合当根 URL;复制一份 index.html 让 https://域名/ 直接打开应用。
# 相对路径(./support.js 等)在同目录下解析一致,无需改任何引用。
cp -f "$REPO_DIR/project/petmon go.dc.html" "$REPO_DIR/project/index.html"

echo "$(date -Is) deployed ${LOCAL:0:7} -> ${REMOTE:0:7}" >> "$LOG"
