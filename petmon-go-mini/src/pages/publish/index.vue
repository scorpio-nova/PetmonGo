<template>
  <view class="container">
    <map
      class="publish-map-bg"
      :latitude="currentLat"
      :longitude="currentLng"
      :markers="mapMarkers"
      :scale="16"
      show-location
    />
    <view class="sheet-backdrop" @click="goBack"></view>
    <view class="publish-sheet">
      <view class="sheet-handle"></view>
      <view class="sheet-header">
        <text class="sheet-title">发布</text>
        <text class="sheet-subtitle">分享你在街区发现的瞬间</text>
        <view class="sheet-close" @click="goBack"><text>×</text></view>
      </view>

      <view class="publish-options">
        <view class="publish-option" @click="goRecognize">
          <text class="option-title">拍照</text>
        </view>
        <view class="publish-option safety" @click="goPubEvent">
          <text class="option-title">安全信息</text>
        </view>
        <view class="publish-option activity" @click="publishSharedTrack">
          <text class="option-title">共享轨迹</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { login } from '@/api/user'
import { computed, ref } from 'vue'
import { petsData } from '@/data/pets'
import { buildMapMarkers } from '@/utils/map-markers'

const currentLat = ref(39.9842)
const currentLng = ref(116.3074)
const mapMarkers = computed(() => buildMapMarkers(petsData, currentLat.value, currentLng.value))

onShow(() => {
  const page = getCurrentPages().pop()
  const tabBar = page && typeof page.getTabBar === 'function' ? page.getTabBar() : null
  if (tabBar) {
    tabBar.setData({ selected: 2 })
  }
})

interface WechatUserProfile {
  userInfo: {
    nickName: string
    avatarUrl: string
  }
}

// 返回上一页
function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}

// 登录并获取用户信息
async function doLogin(): Promise<boolean> {
  try {
    // 调用微信获取用户信息接口
    const userRes = await new Promise<WechatUserProfile>((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: resolve,
        fail: reject
      })
    })

    const loginRes = await login()
    if (loginRes) {
      const userInfo = {
        ...loginRes.userInfo,
        nickName: userRes.userInfo.nickName,
        avatarUrl: userRes.userInfo.avatarUrl
      }
      uni.setStorageSync('userInfo', userInfo)
      return true
    }
    return false
  } catch (err) {
    console.error('login error:', err)
    return false
  }
}

// 检查登录状态
function requireLogin(callback: () => void) {
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo) {
    callback()
    return
  }

  uni.showModal({
    title: '提示',
    content: '此功能需要登录，是否现在登录？',
    success: async (res) => {
      if (res.confirm) {
        const success = await doLogin()
        if (success) {
          callback()
        } else {
          uni.$showToast('登录失败，请重试', 'error')
        }
      }
    }
  })
}

// 去拍照识别
function goRecognize() {
  uni.navigateTo({ url: '/pages/recognize/index' })
}

// 去发布事件
function goPubEvent() {
  requireLogin(() => {
    uni.navigateTo({
      url: '/pages/report-event/index',
    })
  })
}

function publishSharedTrack() {
  uni.$showToast('共享轨迹功能即将上线', 'success')
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
  box-sizing: border-box;
  overflow-x: hidden;
}

.publish-grid {
  display: flex;
  gap: 32rpx;
}

.publish-card {
  flex: 1;
  position: relative;
  padding: 40rpx 20rpx;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  border: 4rpx solid #141414;
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

.container {
  position: relative;
  min-height: 100vh;
  background: #f2f1ec;
  overflow: hidden;
}

.publish-map-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
}

.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 20, 0.32);
  animation: fade-in 180ms ease-out;
}

.publish-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 16rpx 32rpx calc(132rpx + env(safe-area-inset-bottom));
  background: rgba(255, 253, 248, 0.97);
  border-radius: 36rpx 36rpx 0 0;
  box-sizing: border-box;
  animation: slide-up 240ms ease-out;
}

.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto 22rpx;
  background: #c4c1ba;
  border-radius: 8rpx;
}

.sheet-header {
  position: relative;
  padding: 0 8rpx 24rpx;
}

.sheet-title {
  display: block;
  font-size: 46rpx;
  font-weight: 700;
}

.sheet-subtitle {
  display: block;
  margin-top: 4rpx;
  color: #8f8b83;
  font-size: 26rpx;
}

.sheet-close {
  position: absolute;
  top: 0;
  right: 8rpx;
  width: 52rpx;
  height: 52rpx;
  color: #141414;
  font-size: 48rpx;
  line-height: 44rpx;
  text-align: center;
}

.publish-options {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.publish-option {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72rpx;
  padding: 12rpx 20rpx;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-sizing: border-box;
}

.publish-option.safety {
  background: transparent;
}

.publish-option.activity {
  background: transparent;
}

.option-title {
  font-size: 29rpx;
  font-weight: 700;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
