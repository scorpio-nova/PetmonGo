<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="nav-subtitle">发布 · publish</text>
    </view>

    <!-- 发布选项 -->
    <view class="publish-content">
      <view class="publish-grid">
        <!-- 拍照识别 -->
        <view class="publish-card" @click="goRecognize">
          <view class="card-icon-wrapper">
            <text class="card-icon">📷</text>
          </view>
          <view class="card-info">
            <text class="card-title">拍照识别</text>
            <text class="card-desc">遇到毛孩子 snap</text>
          </view>
        </view>

        <!-- 发布事件 -->
        <view class="publish-card event-card" @click="goPubEvent">
          <view class="card-icon-wrapper event-icon">
            <text class="card-icon">⚠️</text>
          </view>
          <view class="card-info">
            <text class="card-title">发布事件</text>
            <text class="card-desc">安全提醒 report</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 去拍照识别（第一阶段不实现）
function goRecognize() {
  uni.showToast({
    title: '宠物识别功能开发中',
    icon: 'none'
  })
}

// 去发布事件（第一阶段不实现）
function goPubEvent() {
  uni.showToast({
    title: '发布事件功能开发中',
    icon: 'none'
  })
}
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

.publish-content {
  padding: 32rpx 52rpx;
}

.publish-grid {
  display: flex;
  gap: 32rpx;
}

.publish-card {
  flex: 1;
  position: relative;
  padding: 40rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  border: 10rpx solid #141414;
  border-radius: 24rpx;
}

.publish-card.event-card {
  background: #fff8e2;
}

.card-icon-wrapper {
  width: 100rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon {
  font-size: 100rpx;
}

.card-info {
  text-align: center;
}

.card-title {
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.1;
}

.card-desc {
  font-size: 28rpx;
  color: #8f8b83;
}
</style>
