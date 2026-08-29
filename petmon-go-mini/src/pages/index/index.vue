<template>
  <view class="container">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-title">
        <text class="app-name">petmon go</text>
        <text class="nav-subtitle">nearby 附近</text>
      </view>
    </view>

    <!-- 地图区域 -->
    <view class="map-section">
      <view class="location-info">
        <text class="location-text">海淀区 Haidian · 附近</text>
        <text class="nearby-count">{{ nearbyPets.length }}</text>
        <text class="location-text">只毛孩子</text>
      </view>

      <!-- 游客模式：显示区域信息 -->
      <view v-if="!isLoggedIn" class="guest-map">
        <view class="guest-pet-icon">
          <image class="guest-icon-img" src="/static/icons/cat.png" mode="aspectFit" />
        </view>
        <view class="guest-bubble">
          <text class="guest-names">{{ guestPetNames }}</text>
          <text class="guest-hint">在此附近</text>
        </view>
      </view>

      <!-- 登录用户：显示精确位置 -->
      <map
        v-else
        class="pet-map"
        :latitude="currentLat"
        :longitude="currentLng"
        :markers="mapMarkers"
        :scale="16"
        :polyline="[]"
        show-location
        @markertap="onMarkerTap"
      >
      </map>
    </view>

    <!-- 附近宠物列表 -->
    <scroll-view class="nearby-list" scroll-y>
      <view class="list-header">
        <text class="list-hint">点一下打招呼 · tap to say hi</text>
      </view>
      <view
        v-for="pet in nearbyPets"
        :key="pet.id"
        class="nearby-item"
        @click="openPetDetail(pet.id)"
      >
        <view class="pet-avatar-wrapper">
          <image class="pet-avatar" :src="pet.photo" mode="aspectFill" />
        </view>
        <view class="pet-info">
          <view class="pet-name-row">
            <text class="pet-en">{{ pet.en }}</text>
            <text class="pet-cn">{{ pet.cn }}</text>
            <view class="pet-tag">{{ pet.tag }}</view>
          </view>
          <text class="pet-area">{{ pet.area }} · {{ pet.dist }}</text>
        </view>
        <text class="pet-stars">{{ getStarStr(pet.stars) }}</text>
      </view>
    </scroll-view>

    <!-- 独立于原生 tabBar 的中心发布按钮；保持原有尺寸和定位，避免 SVG 图标替换后加号丢失。 -->
    <view class="publish-btn" @click="goPublish">
      <image class="publish-icon" src="/static/icons/c-cross-white.svg" mode="aspectFit" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { petsData, type Pet } from '@/data/pets'
import { buildMapMarkers, findPetByMarkerId } from '@/utils/map-markers'
import { getPets } from '@/api/pet'

// 设置自定义 TabBar 选中状态
onShow(() => {
  const page = getCurrentPages().pop()
  const tabBar = page && typeof page.getTabBar === 'function' ? page.getTabBar() : null
  if (tabBar) {
    tabBar.setData({ selected: 0 })
  }
  // 检查登录状态
  isLoggedIn.value = !!uni.getStorageSync('userInfo')
})

// 当前时间
const currentTime = ref('12:51')

// 登录状态
const isLoggedIn = ref(false)

// 地图中心点（模拟位置）
const currentLat = ref(39.9842)
const currentLng = ref(116.3074)

// 选中的宠物
const selectedPet = ref<Pet | null>(null)

// 游客显示的宠物名字列表
const guestPetNames = computed(() => {
  const names = nearbyPets.value.map(p => p.en)
  return names.join(', ')
})

// 虚拟坐标系参数
const ME: [number, number] = [44, 47]
const SCALE_M = 8
const NEARBY_M = 500

// 计算距离
function calcDistance(xy: [number, number]): number {
  const dx = xy[0] - ME[0]
  const dy = xy[1] - ME[1]
  return Math.round(Math.hypot(dx, dy) * SCALE_M)
}

// 格式化距离
function formatDistance(m: number): string {
  return m >= 1000 ? (m / 1000).toFixed(1) + 'km' : m + 'm'
}

// 星级字符串
function getStarStr(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(5 - stars)
}

// 本地宠物数据（fallback）
const localPets = ref(petsData)

// 附近宠物列表
const nearbyPets = computed(() => {
  return localPets.value
    .filter(p => p.xy && p.collected)
    .map(p => ({
      ...p,
      distM: calcDistance(p.xy!),
      dist: formatDistance(calcDistance(p.xy!))
    }))
    .filter(p => p.distM <= NEARBY_M)
    .sort((a, b) => a.distM - b.distM)
})

// 地图标记点
const mapMarkers = computed(() => {
  return buildMapMarkers(petsData, currentLat.value, currentLng.value)
})

// 点击标记点
function onMarkerTap(e: any) {
  const pet = findPetByMarkerId(petsData, e.detail.markerId)
  if (pet) {
    selectedPet.value = pet
  }
}

// 打开宠物详情
function openPetDetail(id: string) {
  uni.navigateTo({
    url: `/pages/pet-detail/index?id=${id}`
  })
}

// 去发布
function goPublish() {
  uni.navigateTo({
    url: '/pages/publish/index'
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
  padding: 20rpx 44rpx 16rpx;
  background: #fffdf8;
}

.nav-title {
  display: flex;
  align-items: baseline;
  gap: 18rpx;
}

.app-name {
  font-family: 'Petmon Gaegu', 'Petmon Long Cang', cursive;
  font-size: 58rpx;
  font-weight: 700;
  letter-spacing: -1rpx;
}

.nav-subtitle {
  font-family: 'Petmon Gaegu', 'Petmon Long Cang', cursive;
  font-size: 32rpx;
  color: #8f8b83;
}

.map-section {
  padding: 0 32rpx;
  box-sizing: border-box;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 0;
  flex-wrap: wrap;
}

.location-text {
  font-size: 32rpx;
  color: #8f8b83;
}

.nearby-count {
  font-size: 36rpx;
  font-weight: 700;
  color: #141414;
}

.pet-map {
  width: 100%;
  height: 60vh;
  min-height: 400rpx;
  max-height: 800rpx;
  border-radius: 52rpx;
  border: 5rpx solid #141414;
  overflow: hidden;
  box-sizing: border-box;
}

/* 游客地图样式 */
.guest-map {
  width: 100%;
  height: 60vh;
  min-height: 400rpx;
  max-height: 800rpx;
  border-radius: 52rpx;
  border: 5rpx solid #141414;
  background: #f2f1ec;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  box-sizing: border-box;
}

.guest-pet-icon {
  width: 120rpx;
  height: 120rpx;
  animation: float 4.5s ease-in-out infinite;
}

.guest-icon-img {
  width: 100%;
  height: 100%;
}

.guest-bubble {
  background: #fff;
  border: 4rpx solid #141414;
  border-radius: 24rpx;
  padding: 20rpx 32rpx;
  text-align: center;
}

.guest-names {
  font-size: 32rpx;
  font-weight: 700;
  color: #141414;
  display: block;
}

.guest-hint {
  font-size: 26rpx;
  color: #8f8b83;
  margin-top: 4rpx;
  display: block;
}

.callout-container {
  display: flex;
  justify-content: center;
}

.callout-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.callout-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 4rpx solid #141414;
}

.callout-name {
  font-size: 26rpx;
  font-weight: 700;
  background: #fff;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  border: 2rpx solid #141414;
}

.nearby-list {
  padding: 36rpx 44rpx;
  box-sizing: border-box;
  overflow-y: auto;
}

.list-header {
  margin-bottom: 12rpx;
}

.list-hint {
  font-size: 30rpx;
  color: #8f8b83;
}

.nearby-item {
  display: flex;
  align-items: center;
  gap: 28rpx;
  padding: 24rpx 8rpx;
  border-bottom: 4rpx solid #eceae3;
  box-sizing: border-box;
}

.pet-avatar-wrapper {
  position: relative;
  width: 112rpx;
  height: 112rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.pet-avatar {
  width: 100%;
  height: 100%;
  border-radius: 24rpx;
  border: 4rpx solid #141414;
}

.pet-info {
  flex: 1;
  min-width: 0;
}

.pet-name-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  flex-wrap: wrap;
}

.pet-en {
  font-size: 42rpx;
  font-weight: 700;
}

.pet-cn {
  font-size: 32rpx;
  color: #8f8b83;
}

.pet-tag {
  font-size: 24rpx;
  font-weight: 700;
  border: 4rpx solid #141414;
  border-radius: 16rpx;
  padding: 0 12rpx;
}

.pet-area {
  font-size: 28rpx;
  color: #8f8b83;
  margin-top: 4rpx;
}

.pet-stars {
  font-size: 32rpx;
  letter-spacing: 2rpx;
}

.publish-btn {
  position: fixed;
  bottom: 140rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 108rpx;
  height: 108rpx;
  background: #141414;
  border-radius: 50%;
  border: 6rpx solid #fffdf8;
  box-shadow: 0 8rpx 0 rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.publish-icon {
  width: 72rpx;
  height: 72rpx;
  display: block;
}
</style>
