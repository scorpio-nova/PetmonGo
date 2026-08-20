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
        <text class="nav-subtitle">dex 图鉴</text>
      </view>
    </view>

    <!-- 图鉴内容 -->
    <view class="dex-content">
      <view class="dex-header">
        <view class="dex-title-row">
          <text class="dex-title">宠物图鉴 · pet dex</text>
          <text v-if="hasNews" class="news-badge">● 有新动态 new!</text>
        </view>
        <text class="dex-desc">收集附近遇见过的猫狗，天使宠物会保留彩色纪念框。</text>
      </view>

      <!-- 宠物网格 -->
      <view class="pet-grid">
        <view
          v-for="pet in collectedPets"
          :key="pet.id"
          class="pet-cell"
          @click="openPetDetail(pet.id)"
        >
          <view class="pet-card" :class="{ 'angel-card': pet.tag === '天使' }">
            <image
              class="pet-avatar"
              :src="pet.photo"
              mode="aspectFill"
            />
            <view class="pet-info">
              <view class="pet-name-row">
                <text class="pet-en">{{ pet.en }}</text>
                <text class="pet-cn">{{ pet.cn }}</text>
              </view>
              <view class="pet-breed-tag">{{ pet.breed }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>
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
    page.getTabBar().setData({ selected: 2 })
  }
})

// 当前时间
const currentTime = ref('12:51')

// 已收集的宠物
const collectedPets = computed(() => {
  return petsData.filter(p => p.collected)
})

// 是否有新动态
const hasNews = computed(() => {
  return petsData.some(p => p.hasUpdate)
})

// 打开宠物详情
function openPetDetail(id: string) {
  uni.navigateTo({
    url: `/pages/pet-detail/index?id=${id}`
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

.dex-content {
  padding: 20rpx 44rpx;
}

.dex-header {
  margin-bottom: 28rpx;
}

.dex-title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.dex-title {
  font-size: 48rpx;
  font-weight: 700;
}

.news-badge {
  font-size: 26rpx;
  font-weight: 700;
  color: #ef6a4f;
}

.dex-desc {
  font-size: 30rpx;
  color: #8f8b83;
  margin-top: 8rpx;
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28rpx;
}

.pet-cell {
  position: relative;
}

.pet-card {
  position: relative;
  padding: 28rpx 20rpx 24rpx;
  background: #fff;
  border: 10rpx solid #141414;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.pet-card.angel-card {
  background: #fff8e2;
  border: 10rpx solid #c3b3e0;
}

.pet-avatar {
  width: 148rpx;
  height: 148rpx;
}

.pet-info {
  text-align: center;
}

.pet-name-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  justify-content: center;
}

.pet-en {
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1;
}

.pet-cn {
  font-size: 26rpx;
  color: #8f8b83;
}

.pet-breed-tag {
  font-size: 24rpx;
  font-weight: 700;
  border: 4rpx solid #141414;
  border-radius: 16rpx;
  padding: 0 14rpx;
  margin-top: 8rpx;
  background: #fff;
}
</style>
