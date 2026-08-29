<template>
  <view class="container">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack"><text class="back-arrow">←</text></view>
      <text class="nav-subtitle">拍照识别 · identify</text>
    </view>

    <view class="content">
      <view class="photo-frame" @click="choosePhoto">
        <image v-if="photo" class="preview-image" :src="photo" mode="aspectFill" />
        <view v-else class="placeholder">
          <text class="camera-icon">📷</text>
          <text class="placeholder-title">上传照片或打开相机</text>
          <text class="placeholder-hint">点击这里选择一张宠物照片</text>
        </view>
      </view>

      <view v-if="status === 'selecting'" class="status-card">
        <text class="status-title">正在准备识别…</text>
        <text class="status-hint">照片已选中，正在检查本地识别模型</text>
      </view>
      <view v-else-if="status === 'unsupported'" class="status-card warning">
        <text class="status-title">照片已收到</text>
        <text class="status-hint">当前小程序包还没有可运行的 CLIP 模型。原网页使用的是约 85 MiB 的 Xenova/clip-vit-base-patch32，不能直接在微信小程序复用；接入 MobileCLIP-S0（或其 ONNX/WXWebAssembly 适配包）后即可在这里完成匹配。</text>
      </view>
      <view v-else-if="status === 'error'" class="status-card error">
        <text class="status-title">{{ errorMessage }}</text>
        <text class="status-hint">请重试，或检查微信的相机与相册权限</text>
      </view>

      <view class="choose-btn" @click="choosePhoto">
        <text class="choose-text">{{ photo ? '重新选择照片' : '选择照片 / 拍照' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getRecognitionErrorMessage, normalizeMediaPath } from '@/utils/recognize'

type Status = 'idle' | 'selecting' | 'unsupported' | 'error'
const photo = ref('')
const status = ref<Status>('idle')
const errorMessage = ref('')

function goBack() {
  uni.navigateBack()
}

function choosePhoto() {
  status.value = 'idle'
  errorMessage.value = ''
  const onSuccess = (result: any) => {
    const path = normalizeMediaPath(result)
    if (!path) {
      status.value = 'error'
      errorMessage.value = '没有拿到照片文件，请重试'
      return
    }
    photo.value = path
    status.value = 'selecting'
    // 目前仅完成选择链路；模型适配完成前明确提示，避免假装返回匹配结果。
    setTimeout(() => { status.value = 'unsupported' }, 250)
  }
  const onFail = (error: unknown) => {
    status.value = 'error'
    errorMessage.value = getRecognitionErrorMessage(error)
    if (!String(errorMessage.value).includes('取消')) uni.$showToast(errorMessage.value, 'error')
  }

  // chooseMedia 是微信基础库 2.10+ 的统一入口；旧基础库回退到 chooseImage。
  if (typeof (uni as any).chooseMedia === 'function') {
    ;(uni as any).chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: onSuccess,
      fail: onFail
    })
  } else {
    ;(uni as any).chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: onSuccess,
      fail: onFail
    })
  }
}
</script>

<style lang="scss" scoped>
.container { min-height: 100vh; background: #fffdf8; }
.nav-bar { display: flex; align-items: center; gap: 24rpx; padding: 80rpx 44rpx 16rpx; }
.nav-back { padding: 8rpx; }
.back-arrow { font-size: 56rpx; color: #141414; }
.nav-subtitle { font-size: 34rpx; color: #8f8b83; }
.content { padding: 32rpx 52rpx; box-sizing: border-box; overflow-x: hidden; }
.photo-frame { position: relative; width: 100%; max-width: 620rpx; height: 620rpx; margin: 0 auto; border: 4rpx solid #141414; border-radius: 24rpx; background: #f8f7f2; overflow: hidden; box-sizing: border-box; }
.placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; }
.camera-icon { font-size: 96rpx; }
.placeholder-title { font-size: 38rpx; font-weight: 700; }
.placeholder-hint { font-size: 28rpx; color: #8f8b83; }
.preview-image { width: 100%; height: 100%; }
.status-card { width: 100%; max-width: 620rpx; margin: 28rpx auto 0; padding: 24rpx 28rpx; border: 4rpx solid #141414; border-radius: 20rpx; background: #fff; box-sizing: border-box; }
.status-card.warning { background: #fff8e2; }
.status-card.error { background: #fff0eb; }
.status-title { display: block; font-size: 36rpx; font-weight: 700; }
.status-hint { display: block; margin-top: 8rpx; font-size: 27rpx; line-height: 1.45; color: #6f6b65; }
.choose-btn { margin-top: 36rpx; padding: 26rpx 0; border-radius: 36rpx; background: #141414; text-align: center; }
.choose-text { color: #fff; font-size: 38rpx; font-weight: 700; }
</style>
