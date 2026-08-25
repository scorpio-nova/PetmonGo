#!/usr/bin/env bash
set -euo pipefail

: "${MINI_PROGRAM_APPID:?MINI_PROGRAM_APPID is required}"
: "${MINI_PROGRAM_PRIVATE_KEY:?MINI_PROGRAM_PRIVATE_KEY is required}"
: "${RUNNER_TEMP:?RUNNER_TEMP is required}"
: "${GITHUB_RUN_NUMBER:?GITHUB_RUN_NUMBER is required}"

project_path="${MINI_PROGRAM_PROJECT_PATH:-petmon-go-mini/dist/build/mp-weixin}"
if [[ ! -d "$project_path" ]]; then
  echo "Mini program build output not found: $project_path" >&2
  exit 1
fi

private_key_path="${RUNNER_TEMP}/miniprogram-ci-private.key"
cleanup() {
  rm -f -- "$private_key_path"
}
trap cleanup EXIT

umask 077
printf '%s' "$MINI_PROGRAM_PRIVATE_KEY" > "$private_key_path"

npx --yes miniprogram-ci@2.1.31 upload \
  --appid "$MINI_PROGRAM_APPID" \
  --project-path "$project_path" \
  --private-key-path "$private_key_path" \
  --upload-version "0.1.${GITHUB_RUN_NUMBER}" \
  --upload-description "Auto deploy from develop branch" \
  --robot 1 \
  --use-project-config true
