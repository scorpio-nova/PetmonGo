<template>
  <view class="container" v-if="event">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="nav-subtitle">安全事件 · read only</text>
    </view>

    <!-- 事件详情 -->
    <scroll-view class="detail-content" scroll-y>
      <!-- 事件头部 -->
      <view class="event-header">
        <text class="event-icon">⚠️</text>
        <view class="event-info">
          <view class="event-title-row">
            <text class="event-title">{{ event.title }}</text>
            <view class="event-type-tag">{{ event.type }}</view>
          </view>
          <text class="event-meta">{{ event.place }} · {{ event.time }} · by {{ event.by }}</text>
        </view>
      </view>

      <!-- 地图位置 -->
      <view class="map-section">
        <view class="map-placeholder">
          <text class="map-icon">📍</text>
          <view class="map-label">精确位置</view>
        </view>
        <text class="map-source">高德地图 API</text>
      </view>

      <!-- 事件描述 -->
      <view class="desc-section">
        <text class="event-desc">{{ event.desc }}</text>
      </view>

      <!-- 警告信息 -->
      <view class="warn-section">
        <view class="warn-card">
          <text class="warn-title">⚠ 提醒 · notice</text>
          <text class="warn-text">{{ getWarnCopy(event.type) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { eventsData, getWarnCopy, type Event } from '@/data/events'

const event = ref<Event | null>(null)

// 返回上一页
function goBack() {
  uni.navigateBack()
}

onLoad((options) => {
  if (options?.id) {
    event.value = eventsData.find(e => e.id === options.id) || null
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

.detail-content {
  padding: 16rpx 52rpx 56rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.event-icon {
  font-size: 92rpx;
  flex-shrink: 0;
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-title-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  flex-wrap: wrap;
}

.event-title {
  font-size: 52rpx;
  font-weight: 700;
}

.event-type-tag {
  font-size: 26rpx;
  font-weight: 700;
  background: #141414;
  color: #fff;
  border-radius: 16rpx;
  padding: 0 16rpx;
}

.event-meta {
  font-size: 28rpx;
  color: #8f8b83;
  margin-top: 8rpx;
}

.map-section {
  position: relative;
  height: 340rpx;
  margin-top: 28rpx;
  border-radius: 32rpx;
  overflow: hidden;
  background: #f2f1ec;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.map-icon {
  font-size: 68rpx;
}

.map-label {
  font-size: 24rpx;
  font-weight: 700;
  background: #141414;
  color: #fff;
  border-radius: 16rpx;
  padding: 0 16rpx;
  margin-top: 8rpx;
}

.map-source {
  position: absolute;
  left: 20rpx;
  bottom: 12rpx;
  font-size: 24rpx;
  color: #8f8b83;
  background: #fff;
  border-radius: 16rpx;
  padding: 0 16rpx;
}

.desc-section {
  margin-top: 28rpx;
}

.event-desc {
  font-size: 34rpx;
  color: #3a3a3a;
  line-height: 1.45;
}

.warn-section {
  margin-top: 32rpx;
}

.warn-card {
  position: relative;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 32rpx 36rpx;
  background: #fff3ee;
  border: 4rpx solid #141414;
  border-radius: 20rpx;
}

.warn-title {
  font-size: 34rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.warn-text {
  font-size: 32rpx;
  color: #3a3a3a;
  line-height: 1.45;
  overflow-wrap: break-word;
}
</style>
