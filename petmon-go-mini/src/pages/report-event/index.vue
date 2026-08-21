<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="nav-subtitle">发布安全事件 · report</text>
    </view>

    <!-- 发布内容 -->
    <scroll-view class="report-content" scroll-y>
      <!-- 事件类型 -->
      <view class="section">
        <text class="section-label">类型 · type</text>
        <view class="type-chips">
          <view
            v-for="t in eventTypes"
            :key="t"
            class="chip"
            :class="{ active: eventType === t }"
            @click="eventType = t"
          >
            <text class="chip-text">{{ t }}</text>
          </view>
        </view>
      </view>

      <!-- 事件描述 -->
      <view class="section">
        <text class="section-label">事件内容 · what happened</text>
        <textarea
          v-model="eventDesc"
          class="desc-input"
          placeholder="写清楚时间、地点、经过…"
          :maxlength="500"
        />
      </view>

      <!-- 位置信息 -->
      <view class="section">
        <text class="section-label">精确位置 · location</text>
        <view class="location-card">
          <view class="location-placeholder">
            <text class="location-icon">📍</text>
            <text class="location-text">Maple St 街角</text>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-btn" @click="submitEvent">
        <text class="submit-text">提交 · submit</text>
      </view>
      <text class="submit-hint">提交后回到地图，附近用户会收到推送提醒</text>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const eventTypes = ['虐猫', '丢失', '抓人', '咬人']
const eventType = ref('丢失')
const eventDesc = ref('')

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 提交事件
function submitEvent() {
  if (!eventDesc.value.trim()) {
    uni.$showToast('请填写事件描述', 'error')
    return
  }

  // 创建事件数据
  const newEvent = {
    id: 'evt_' + Date.now(),
    type: eventType.value,
    title: eventType.value === '丢失' ? '宠物丢失' : eventType.value + '提醒',
    desc: eventDesc.value,
    place: 'Maple St 街角',
    time: new Date().toLocaleString('zh-CN'),
    by: 'Mille',
  }

  // 保存到本地
  const events = uni.getStorageSync('events')
  const eventsList = events ? JSON.parse(events) : []
  eventsList.unshift(newEvent)
  uni.setStorageSync('events', JSON.stringify(eventsList))

  // 显示成功提示
  uni.$showToast('已发布，附近用户将收到提醒 🐾', 'success')

  // 跳转到地图页
  setTimeout(() => {
    uni.switchTab({
      url: '/pages/index/index',
    })
  }, 1500)
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

.report-content {
  padding: 20rpx 44rpx 60rpx;
}

.section {
  margin-bottom: 32rpx;
}

.section-label {
  font-size: 30rpx;
  color: #8f8b83;
  margin-bottom: 12rpx;
  display: block;
}

.type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chip {
  padding: 12rpx 28rpx;
  border: 4rpx solid #141414;
  border-radius: 24rpx;
  background: #fff;
}

.chip.active {
  background: #141414;
}

.chip-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #141414;
}

.chip.active .chip-text {
  color: #fff;
}

.desc-input {
  width: 100%;
  height: 240rpx;
  font-size: 32rpx;
  border: 4rpx solid #141414;
  border-radius: 24rpx;
  padding: 20rpx;
  background: #fff;
  box-sizing: border-box;
}

.location-card {
  background: #f2f1ec;
  border: 4rpx solid #141414;
  border-radius: 24rpx;
  padding: 32rpx;
}

.location-placeholder {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.location-icon {
  font-size: 40rpx;
}

.location-text {
  font-size: 32rpx;
  font-weight: 700;
}

.submit-btn {
  margin-top: 40rpx;
  background: #141414;
  color: #fff;
  border-radius: 36rpx;
  padding: 28rpx 0;
  text-align: center;
}

.submit-text {
  font-size: 38rpx;
  font-weight: 700;
}

.submit-hint {
  font-size: 26rpx;
  color: #8f8b83;
  text-align: center;
  margin-top: 16rpx;
  display: block;
}
</style>
