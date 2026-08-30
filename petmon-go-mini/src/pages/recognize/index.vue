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
        <text class="status-hint">照片已选中，正在上传到安全识别服务</text>
      </view>
      <view v-else-if="status === 'recognizing'" class="status-card">
        <text class="status-title">CLIP 正在匹配…</text>
        <text class="status-hint">后端模型正在和宠物图库比对，请稍候</text>
      </view>
      <view v-else-if="status === 'success'" class="status-card success">
        <text class="status-title">识别完成</text>
        <view v-if="result?.matches.length" class="match-list">
          <view v-for="(match, index) in result.matches" :key="match.petId" class="match-row">
            <text class="match-rank">{{ index + 1 }}</text>
            <view class="match-info">
              <text class="match-name">{{ match.name || match.petId }}<text v-if="match.cnName"> · {{ match.cnName }}</text></text>
              <text class="match-score">相似度 {{ formatScore(match.score) }}</text>
            </view>
          </view>
        </view>
        <text v-else class="status-hint">图库中暂时没有足够相似的宠物</text>
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
import { recognizePet, type RecognitionResult } from '@/api/recognize'
import { getRecognitionErrorMessage, normalizeMediaPath } from '@/utils/recognize'

type Status = 'idle' | 'selecting' | 'recognizing' | 'success' | 'error'
const photo = ref('')
const status = ref<Status>('idle')
const errorMessage = ref('')
const result = ref<RecognitionResult | null>(null)

function goBack() {
  uni.navigateBack()
}

function choosePhoto() {
  status.value = 'idle'
  errorMessage.value = ''
  result.value = null
  const onSuccess = (result: any) => {
    const path = normalizeMediaPath(result)
    if (!path) {
      status.value = 'error'
      errorMessage.value = '没有拿到照片文件，请重试'
      return
    }
    photo.value = path
    status.value = 'selecting'
    void runRecognition(path)
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

async function runRecognition(path: string): Promise<void> {
  status.value = 'recognizing'
  uni.$showToast('识别中...', 'loading', 0)
  try {
    const recognition = await recognizePet(path)
    uni.$hideToast()
    if (!recognition) {
      status.value = 'error'
      errorMessage.value = '识别服务暂时不可用，请稍后重试'
      return
    }
    result.value = recognition
    status.value = 'success'
  } catch (error) {
    uni.$hideToast()
    status.value = 'error'
    errorMessage.value = getRecognitionErrorMessage(error)
  }
}

function formatScore(score: number): string {
  return `${Math.round(Math.max(0, Math.min(1, score)) * 100)}%`
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
.status-card.success { background: #eff9ed; }
.status-title { display: block; font-size: 36rpx; font-weight: 700; }
.status-hint { display: block; margin-top: 8rpx; font-size: 27rpx; line-height: 1.45; color: #6f6b65; }
.match-list { margin-top: 18rpx; }
.match-row { display: flex; align-items: center; gap: 18rpx; padding: 14rpx 0; border-top: 2rpx solid #d9e8d3; }
.match-rank { width: 42rpx; height: 42rpx; border-radius: 50%; background: #141414; color: #fff; text-align: center; line-height: 42rpx; font-size: 24rpx; }
.match-info { display: flex; flex-direction: column; gap: 4rpx; }
.match-name { font-size: 30rpx; font-weight: 700; }
.match-score { font-size: 24rpx; color: #6f6b65; }
.choose-btn { margin-top: 36rpx; padding: 26rpx 0; border-radius: 36rpx; background: #141414; text-align: center; }
.choose-text { color: #fff; font-size: 38rpx; font-weight: 700; }
</style>
