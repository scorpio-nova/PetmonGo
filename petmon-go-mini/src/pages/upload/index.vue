<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="nav-subtitle">上传相遇 · {{ pet?.en || '' }}</text>
    </view>

    <!-- 上传内容 -->
    <scroll-view class="upload-content" scroll-y>
      <!-- 照片上传区域 -->
      <view class="photo-upload">
        <view class="photo-frame">
          <view
            v-if="!photo"
            class="upload-placeholder"
            @click="choosePhoto"
          >
            <text class="upload-icon">📷</text>
            <text class="upload-text">放一张今天的合照</text>
          </view>
          <view v-else class="photo-preview">
            <image class="preview-image" :src="photo" mode="aspectFill" />
            <view class="photo-delete" @click="deletePhoto">
              <text class="delete-icon">×</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 地点信息 -->
      <view class="location-section">
        <text class="section-label">地点 · where</text>
        <view class="location-info">
          <text class="location-icon">📍</text>
          <text class="location-text">{{ pet?.area || '当前位置' }} · 自动定位</text>
        </view>
      </view>

      <!-- 备注输入 -->
      <view class="note-section">
        <text class="section-label">这次相遇 · note</text>
        <textarea
          v-model="note"
          class="note-input"
          placeholder="今天 TA 心情怎么样？"
          :maxlength="200"
        />
      </view>

      <!-- 提交按钮 -->
      <view class="submit-btn" @click="submitUpload">
        <text class="submit-text">更新动态 · update</text>
      </view>

      <text class="submit-hint">发布后你的图鉴会收到新动态</text>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { petsData, type Pet } from '@/data/pets'

const pet = ref<Pet | null>(null)
const photo = ref('')
const note = ref('')

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 选择照片
function choosePhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      photo.value = res.tempFilePaths[0]
    }
  })
}

// 删除照片
function deletePhoto() {
  photo.value = ''
}

// 提交上传
function submitUpload() {
  uni.showToast({
    title: '已记录相遇 🐾',
    icon: 'none'
  })
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}

onLoad((options) => {
  if (options?.id) {
    pet.value = petsData.find(p => p.id === options.id) || null
  }
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #fffdf8;
}

.nav-bar {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 80rpx 44rpx 16rpx;
  background: #fffdf8;
  z-index: 10;
}

.nav-back {
  cursor: pointer;
  padding: 8rpx;
}

.back-arrow {
  font-size: 56rpx;
  color: #141414;
}

.nav-subtitle {
  font-size: 34rpx;
  color: #8f8b83;
}

.upload-content {
  padding: 20rpx 52rpx 56rpx;
}

.photo-upload {
  display: flex;
  justify-content: center;
}

.photo-frame {
  position: relative;
  width: 100%;
  height: 560rpx;
  padding: 16rpx;
}

.photo-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 14rpx solid #141414;
  border-radius: 14rpx;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  background: #f9f9f9;
  border-radius: 12rpx;
}

.upload-icon {
  font-size: 80rpx;
}

.upload-text {
  font-size: 32rpx;
  color: #8f8b83;
}

.photo-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.photo-delete {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
}

.location-section {
  margin-top: 32rpx;
}

.section-label {
  font-size: 32rpx;
  color: #8f8b83;
  margin-bottom: 8rpx;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.location-icon {
  font-size: 36rpx;
}

.location-text {
  font-size: 38rpx;
  font-weight: 700;
}

.note-section {
  margin-top: 24rpx;
}

.note-input {
  width: 100%;
  height: 180rpx;
  font-size: 36rpx;
  border: 5rpx solid #141414;
  border-radius: 28rpx;
  padding: 20rpx 24rpx;
  background: #fff;
  margin-top: 8rpx;
  box-sizing: border-box;
}

.submit-btn {
  margin-top: 36rpx;
  background: #141414;
  color: #fff;
  border-radius: 36rpx;
  padding: 26rpx 0;
  text-align: center;
}

.submit-text {
  font-size: 40rpx;
  font-weight: 700;
}

.submit-hint {
  font-size: 28rpx;
  color: #8f8b83;
  text-align: center;
  margin-top: 20rpx;
}
</style>
