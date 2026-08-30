#!/usr/bin/env bash
set -euo pipefail

# Build a minimal CloudBase CloudRun source directory without copying keys or
# the rest of the repository. Run this script from the repository root.

env_id="${CLOUDBASE_ENV_ID:-petmon-backend-d0gdzcyjw2d9f70ba}"
service_name="${CLOUDBASE_CLIP_SERVICE_NAME:-petmon-clip}"
clip_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
stage_dir="$(mktemp -d "${TMPDIR:-/tmp}/petmon-clip-cloudrun.XXXXXX")"
cleanup() { rm -rf -- "$stage_dir"; }
trap cleanup EXIT

mkdir -p "$stage_dir/models"
cp "$clip_root/backend/clip-service/app.py" "$stage_dir/app.py"
cp "$clip_root/backend/clip-service/requirements.txt" "$stage_dir/requirements.txt"
cp "$clip_root/backend/clip-service/Dockerfile.cloudrun" "$stage_dir/Dockerfile"
cp "$clip_root/project/models/Xenova/clip-vit-base-patch32/onnx/vision_model_quantized.onnx" "$stage_dir/models/vision_model_quantized.onnx"

echo "Deploying ${service_name} to ${env_id} (source size: $(du -sh "$stage_dir" | awk '{print $1}'))"
tcb cloudrun deploy \
  -e "$env_id" \
  -s "$service_name" \
  --source "$stage_dir" \
  --port 8080 \
  --install-dependency true \
  --force \
  --wait
