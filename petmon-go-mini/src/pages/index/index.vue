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

      <map
        class="pet-map"
        :latitude="currentLat"
        :longitude="currentLng"
        :markers="mapMarkers"
        :scale="16"
        :polyline="[]"
        show-location
        @markertap="onMarkerTap"
      >
        <!-- 自定义标记点样式 -->
        <view slot="callout" class="callout-container" v-if="selectedPet">
          <view class="callout-bubble">
            <image class="callout-avatar" :src="selectedPet.photo" mode="aspectFill" />
            <text class="callout-name">{{ selectedPet.en }}</text>
          </view>
        </view>
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { petsData, type Pet } from '@/data/pets'
import { buildMapMarkers, findPetByMarkerId } from '@/utils/map-markers'

// 设置自定义 TabBar 选中状态
onShow(() => {
  const page = getCurrentPages().pop()
  const tabBar = page && typeof page.getTabBar === 'function' ? page.getTabBar() : null
  if (tabBar) {
    tabBar.setData({ selected: 0 })
  }
})

// 当前时间
const currentTime = ref('12:51')

// 地图中心点（模拟位置）
const currentLat = ref(39.9842)
const currentLng = ref(116.3074)

// 选中的宠物
const selectedPet = ref<Pet | null>(null)

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

// 附近宠物列表
const nearbyPets = computed(() => {
  return petsData
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
  font-family: 'Gaegu', 'Long Cang', cursive;
  font-size: 58rpx;
  font-weight: 700;
  letter-spacing: -1rpx;
}

.nav-subtitle {
  font-family: 'Gaegu', 'Long Cang', cursive;
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
  color: #fff;
  font-size: 72rpx;
  font-weight: 700;
  line-height: 1;
}
</style>
