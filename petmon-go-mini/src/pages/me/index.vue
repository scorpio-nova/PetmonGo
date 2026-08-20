<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-status">
        <text class="time">{{ currentTime }}</text>
        <view class="battery">
          <text class="battery-text">45</text>
        </view>
      </view>
      <view class="nav-title">
        <text class="app-name">petmon go</text>
        <text class="nav-subtitle">me 我的</text>
      </view>
    </view>

    <!-- 我的内容 -->
    <scroll-view class="me-content" scroll-y>
      <!-- 设置按钮 -->
      <view class="settings-btn" @click="openSettings">
        <text class="settings-icon">⚙️</text>
        <text class="settings-text">设置</text>
      </view>

      <!-- 用户信息 -->
      <view class="user-section">
        <view class="avatar-wrapper">
          <view class="avatar-placeholder">
            <text class="avatar-text">M</text>
          </view>
        </view>
        <text class="user-name">Mille</text>
        <text class="user-desc">已经在 petmon 活跃 128 天 · 陪伴 {{ collectedCount }} 只毛孩子 · 投喂 {{ myFeeds }} 次</text>
      </view>

      <!-- 统计数据 -->
      <view class="stats-section">
        <view class="stats-card">
          <view class="stat-item">
            <text class="stat-number">{{ myFeeds }}</text>
            <text class="stat-label">投喂 feeds</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-number">{{ collectedCount }}</text>
            <text class="stat-label">已收集 met</text>
          </view>
          <view class="stat-divider" />
          <view class="stat-item">
            <text class="stat-number">8</text>
            <text class="stat-label">去过 spots</text>
          </view>
        </view>
      </view>

      <!-- 成就 -->
      <view class="achievement-section">
        <view class="achievement-header">
          <text class="achievement-title">成就 achievements</text>
          <text class="achievement-count">4 / 12 已解锁</text>
        </view>
        <view class="achievement-card">
          <view class="achievement-grid">
            <view class="achievement-item">
              <view class="achievement-icon">🏆</view>
              <view class="achievement-info">
                <text class="achievement-name">最佳投喂人</text>
                <text class="achievement-desc">本周</text>
              </view>
            </view>
            <view class="achievement-item">
              <view class="achievement-icon">🍜</view>
              <view class="achievement-info">
                <text class="achievement-name">投喂达人</text>
                <text class="achievement-desc">{{ myFeeds }} 次</text>
              </view>
            </view>
            <view class="achievement-item">
              <view class="achievement-icon">📍</view>
              <view class="achievement-info">
                <text class="achievement-name">街区常客</text>
                <text class="achievement-desc">8 地点</text>
              </view>
            </view>
            <view class="achievement-item">
              <view class="achievement-icon">📸</view>
              <view class="achievement-info">
                <text class="achievement-name">记录者</text>
                <text class="achievement-desc">{{ collectedCount }} 只</text>
              </view>
            </view>
            <view class="achievement-item locked">
              <view class="achievement-icon">🔒</view>
              <view class="achievement-info">
                <text class="achievement-name">长途遛宠</text>
                <text class="achievement-desc">25km</text>
              </view>
            </view>
            <view class="achievement-item locked">
              <view class="achievement-icon">🔒</view>
              <view class="achievement-info">
                <text class="achievement-name">社区守护</text>
                <text class="achievement-desc">5 提醒</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { petsData } from '@/data/pets'

// 设置自定义 TabBar 选中状态
onShow(() => {
  const page = getCurrentPages().pop()
  if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
    page.getTabBar().setData({ selected: 3 })
  }
})

// 当前时间
const currentTime = ref('12:51')

// 投喂次数
const myFeeds = ref(15)

// 已收集宠物数量
const collectedCount = computed(() => {
  return petsData.filter(p => p.collected).length
})

// 打开设置
function openSettings() {
  uni.showToast({
    title: '设置功能开发中',
    icon: 'none'
  })
}

// 获取当前时间
function updateTime() {
  const now = new Date()
  currentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 60000)
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #fffdf8;
  padding-bottom: 120rpx;
  overflow-x: hidden;
}

.nav-bar {
  padding: 80rpx 44rpx 16rpx;
  background: #fffdf8;
}

.nav-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4rpx;
}

.time {
  font-size: 34rpx;
  font-weight: 700;
}

.battery {
  display: flex;
  align-items: center;
  border: 4rpx solid #141414;
  border-radius: 10rpx;
  padding: 0 10rpx;
  height: 38rpx;
}

.battery-text {
  font-size: 26rpx;
  font-weight: 700;
}

.nav-title {
  display: flex;
  align-items: baseline;
  gap: 18rpx;
}

.app-name {
  font-size: 58rpx;
  font-weight: 700;
  letter-spacing: -1rpx;
}

.nav-subtitle {
  font-size: 32rpx;
  color: #8f8b83;
}

.me-content {
  padding: 20rpx 44rpx;
  box-sizing: border-box;
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  border: 4rpx solid #141414;
  border-radius: 28rpx;
  padding: 6rpx 24rpx;
  float: right;
}

.settings-icon {
  font-size: 36rpx;
}

.settings-text {
  font-size: 28rpx;
  font-weight: 700;
}

.user-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20rpx;
  clear: both;
}

.avatar-wrapper {
  position: relative;
  width: 300rpx;
  height: 336rpx;
}

.avatar-placeholder {
  position: absolute;
  left: 150rpx;
  top: 134rpx;
  transform: translate(-50%, -50%);
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #f5f5f5;
  border: 4rpx solid #141414;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #141414;
}

.user-name {
  font-size: 60rpx;
  font-weight: 700;
  margin-top: 4rpx;
}

.user-desc {
  font-size: 30rpx;
  color: #8f8b83;
  margin-top: 16rpx;
  text-align: center;
}

.stats-section {
  margin-top: 28rpx;
}

.stats-card {
  position: relative;
  display: flex;
  padding: 8rpx 0;
  background: #fff;
  border: 10rpx solid #141414;
  border-radius: 16rpx;
}

.stat-item {
  flex: 1;
  padding: 20rpx 12rpx;
  text-align: center;
}

.stat-divider {
  width: 4rpx;
  background: #eceae3;
  margin: 10rpx 0;
}

.stat-number {
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 26rpx;
  color: #8f8b83;
  margin-top: 8rpx;
}

.achievement-section {
  margin-top: 48rpx;
}

.achievement-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24rpx;
}

.achievement-title {
  font-size: 46rpx;
  font-weight: 700;
}

.achievement-count {
  font-size: 28rpx;
  color: #8f8b83;
}

.achievement-card {
  position: relative;
  padding: 40rpx 32rpx;
  background: #fff8e2;
  border: 8rpx solid #141414;
  border-radius: 24rpx;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40rpx 16rpx;
}

.achievement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.achievement-item.locked {
  opacity: 0.4;
}

.achievement-icon {
  width: 116rpx;
  height: 116rpx;
  border: 5rpx solid #141414;
  border-radius: 32rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 76rpx;
}

.achievement-item.locked .achievement-icon {
  border-style: dashed;
}

.achievement-info {
  text-align: center;
}

.achievement-name {
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.05;
}

.achievement-desc {
  font-size: 22rpx;
  color: #8f8b83;
}
</style>
