<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="nav-subtitle">消息与通知 · inbox</text>
    </view>

    <!-- 通知列表 -->
    <scroll-view class="inbox-content" scroll-y>
      <view v-if="notices.length === 0" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消息</text>
      </view>

      <view
        v-for="notice in notices"
        :key="notice.id"
        class="notice-item"
        :class="{ unread: notice.unread }"
        @click="readNotice(notice)"
      >
        <view class="notice-icon-wrapper" :style="{ background: notice.bg }">
          <text class="notice-icon">{{ getIcon(notice.icon) }}</text>
        </view>
        <view class="notice-info">
          <text class="notice-title">{{ notice.title }}</text>
          <text class="notice-body">{{ notice.body }}</text>
        </view>
        <view v-if="notice.unread" class="unread-dot"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

interface Notice {
  id: string
  icon: string
  bg: string
  title: string
  body: string
  unread: boolean
}

const notices = ref<Notice[]>([])

// 获取图标
function getIcon(icon: string): string {
  const icons: Record<string, string> = {
    catfood: '🐟',
    dogfood: '🦴',
    label: '🏷️',
    water: '💧',
    pin: '📍',
  }
  return icons[icon] || '📬'
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 读取通知
function readNotice(notice: Notice) {
  notice.unread = false
  saveNotices()
}

// 加载通知
function loadNotices() {
  const saved = uni.getStorageSync('notices')
  if (saved) {
    notices.value = JSON.parse(saved)
  } else {
    // 默认通知
    notices.value = [
      { id: 'n1', icon: 'catfood', bg: '#fff8e2', title: 'Memw 收到新投喂', body: 'Mille 在咪想咖啡门口留下小鱼干', unread: false },
      { id: 'n2', icon: 'label', bg: '#eef4dc', title: '图鉴有新动态', body: 'Catt 今天 14:40 出现在车棚顶', unread: false },
      { id: 'n3', icon: 'water', bg: '#e8f4ff', title: '附近补水点更新', body: 'Riverside 新增可用水碗', unread: false },
    ]
    saveNotices()
  }
}

// 保存通知
function saveNotices() {
  uni.setStorageSync('notices', JSON.stringify(notices.value))
}

// 添加通知（供其他页面调用）
function addNotice(icon: string, bg: string, title: string, body: string) {
  const newNotice: Notice = {
    id: 'n' + Date.now(),
    icon,
    bg,
    title,
    body,
    unread: true,
  }
  notices.value.unshift(newNotice)
  saveNotices()
}

// 暴露方法
defineExpose({ addNotice })

onMounted(() => {
  loadNotices()
})

onShow(() => {
  // 标记所有为已读
  notices.value.forEach(n => n.unread = false)
  saveNotices()
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

.inbox-content {
  padding: 20rpx 44rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 96rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #8f8b83;
  margin-top: 16rpx;
}

.notice-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  background: #fff;
  border: 4rpx solid #141414;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.notice-item.unread {
  background: #fff8e2;
}

.notice-icon-wrapper {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notice-icon {
  font-size: 40rpx;
}

.notice-info {
  flex: 1;
  min-width: 0;
}

.notice-title {
  font-size: 32rpx;
  font-weight: 700;
  display: block;
}

.notice-body {
  font-size: 26rpx;
  color: #8f8b83;
  margin-top: 4rpx;
  display: block;
}

.unread-dot {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 16rpx;
  height: 16rpx;
  background: #ef6a4f;
  border-radius: 50%;
}
</style>
