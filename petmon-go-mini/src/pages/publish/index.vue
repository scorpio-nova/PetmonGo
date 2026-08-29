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
import { login } from '@/api/user'

interface WechatUserProfile {
  userInfo: {
    nickName: string
    avatarUrl: string
  }
}

// 返回上一页
function goBack() {
  uni.navigateBack()
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
