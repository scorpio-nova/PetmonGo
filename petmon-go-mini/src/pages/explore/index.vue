<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-title">
        <text class="app-name">petmon go</text>
        <text class="nav-subtitle">explore 探索</text>
      </view>
    </view>

    <!-- 探索内容 -->
    <scroll-view class="explore-content" scroll-y>
      <!-- 附近宠物 -->
      <view class="section">
        <text class="section-title">附近宠物 · pets nearby</text>
        <scroll-view class="pet-scroll" scroll-x>
          <view class="pet-list">
            <view
              v-for="pet in nearbyPets"
              :key="pet.id"
              class="pet-item"
              @click="openPetDetail(pet.id)"
            >
              <view class="pet-avatar-wrapper">
                <image class="pet-avatar" :src="pet.photo" mode="aspectFill" />
              </view>
              <text class="pet-name">{{ pet.en }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 安全事件 -->
      <view class="section">
        <text class="section-title">安全事件 · safety</text>
        <view
          v-for="event in events"
          :key="event.id"
          class="event-card"
          @click="openEventDetail(event.id)"
        >
          <text class="event-icon">⚠️</text>
          <view class="event-info">
            <view class="event-title-row">
              <text class="event-title">{{ event.title }}</text>
              <view class="event-type-tag">{{ event.type }}</view>
            </view>
            <text class="event-meta">{{ event.place }} · {{ event.time }}</text>
          </view>
          <text class="event-arrow">›</text>
        </view>
      </view>

      <!-- 宠物日志 -->
      <view class="section">
        <text class="section-title">宠物日志 · pet log</text>
        <view class="log-card">
          <image class="log-image" src="/static/pets/catt-1.jpg" mode="aspectFill" />
          <view class="log-info">
            <text class="log-text">Catt 今天中午在花坛边晒肚皮，被 3 个路人拍了照。摸鱼一整天。</text>
            <text class="log-meta">by Momo · 今天 14:02</text>
          </view>
        </view>
      </view>

      <!-- 天使故事 -->
      <view class="section">
        <text class="section-title">天使故事 · angel story</text>
        <view class="angel-card">
          <image class="angel-image" src="/static/pets/scar-1.jpg" mode="aspectFill" />
          <view class="angel-info">
            <text class="angel-text">刀疤在这个街区生活了 6 年，去年冬天去了喵星。大家还会在老地方给它留小鱼干。</text>
            <text class="angel-meta">by 楼下阿姨 · 3 天前</text>
          </view>
        </view>
      </view>

      <!-- 地点评价 -->
      <view class="section">
        <text class="section-title">地点评价 · places</text>
        <view class="place-card">
          <view class="place-image-placeholder">
            <text class="place-emoji">☕</text>
          </view>
          <view class="place-info">
            <view class="place-name-row">
              <text class="place-name">咪想咖啡</text>
              <text class="place-stars">★★★★☆</text>
            </view>
            <text class="place-desc">"店里有猫抓板和水碗，狗狗可进" · 26 条评价</text>
          </view>
        </view>
      </view>

      <!-- 遛宠路线 -->
      <view class="section">
        <text class="section-title">遛宠路线 · walk route</text>
        <view class="route-card">
          <view class="route-image-placeholder">
            <text class="route-emoji">🚶</text>
          </view>
          <view class="route-info">
            <text class="route-name">河边慢走圈 · riverside loop</text>
            <text class="route-desc">2.1 km · 35 min · 一路 4 只毛孩子</text>
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
import { eventsData } from '@/data/events'

// 设置自定义 TabBar 选中状态
onShow(() => {
  const page = getCurrentPages().pop()
  const tabBar = page && typeof page.getTabBar === 'function' ? page.getTabBar() : null
  if (tabBar) {
    tabBar.setData({ selected: 1 })
  }
})

// 当前时间
const currentTime = ref('12:51')

// 附近宠物（前5只）
const nearbyPets = computed(() => {
  return petsData.filter(p => p.collected).slice(0, 5)
})

// 事件列表
const events = computed(() => eventsData)

// 打开宠物详情
function openPetDetail(id: string) {
  uni.navigateTo({
    url: `/pages/pet-detail/index?id=${id}`
  })
}

// 打开事件详情
function openEventDetail(id: string) {
  uni.navigateTo({
    url: `/pages/event-detail/index?id=${id}`
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
  font-size: 32rpx;
  color: #8f8b83;
}

.explore-content {
  padding: 8rpx 44rpx;
  box-sizing: border-box;
}

.section {
  margin-bottom: 36rpx;
  box-sizing: border-box;
}

.section-title {
  font-size: 40rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.pet-scroll {
  white-space: nowrap;
}

.pet-list {
  display: inline-flex;
  gap: 24rpx;
}

.pet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  width: 192rpx;
}

.pet-avatar-wrapper {
  position: relative;
  width: 168rpx;
  height: 168rpx;
}

.pet-avatar {
  width: 100%;
  height: 100%;
  border-radius: 52rpx;
  border: 10rpx solid #141414;
}

.pet-name {
  font-size: 30rpx;
  font-weight: 700;
}

.event-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 32rpx;
  background: #fff;
  border: 10rpx solid #141414;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
}

.event-icon {
  font-size: 76rpx;
}

.event-info {
  flex: 1;
}

.event-title-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.event-title {
  font-size: 36rpx;
  font-weight: 700;
}

.event-type-tag {
  font-size: 24rpx;
  font-weight: 700;
  background: #141414;
  color: #fff;
  border-radius: 16rpx;
  padding: 0 14rpx;
}

.event-meta {
  font-size: 28rpx;
  color: #8f8b83;
  margin-top: 4rpx;
}

.event-arrow {
  font-size: 40rpx;
  color: #8f8b83;
}

.log-card {
  position: relative;
  display: flex;
  gap: 24rpx;
  padding: 20rpx;
  background: #fff;
  border: 10rpx solid #141414;
  border-radius: 20rpx;
}

.log-image {
  width: 184rpx;
  height: 184rpx;
  border-radius: 24rpx;
  flex-shrink: 0;
}

.log-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.log-text {
  font-size: 28rpx;
  line-height: 1.35;
}

.log-meta {
  font-size: 24rpx;
  color: #8f8b83;
  margin-top: 10rpx;
}

.angel-card {
  position: relative;
  display: flex;
  gap: 24rpx;
  padding: 20rpx;
  background: #fff8e2;
  border: 10rpx solid #141414;
  border-radius: 20rpx;
}

.angel-image {
  width: 184rpx;
  height: 184rpx;
  border-radius: 24rpx;
  flex-shrink: 0;
}

.angel-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.angel-text {
  font-size: 28rpx;
  line-height: 1.35;
}

.angel-meta {
  font-size: 24rpx;
  color: #8f8b83;
  margin-top: 10rpx;
}

.place-card {
  position: relative;
  display: flex;
  gap: 24rpx;
  padding: 20rpx;
  background: #fff;
  border: 10rpx solid #141414;
  border-radius: 20rpx;
}

.place-image-placeholder {
  width: 184rpx;
  height: 184rpx;
  border-radius: 24rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.place-emoji {
  font-size: 72rpx;
}

.place-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.place-name-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.place-name {
  font-size: 32rpx;
  font-weight: 700;
}

.place-stars {
  font-size: 28rpx;
}

.place-desc {
  font-size: 24rpx;
  color: #8f8b83;
  margin-top: 8rpx;
  line-height: 1.35;
}

.route-card {
  position: relative;
  display: flex;
  gap: 24rpx;
  padding: 20rpx;
  background: #eef4dc;
  border: 10rpx solid #141414;
  border-radius: 20rpx;
}

.route-image-placeholder {
  width: 184rpx;
  height: 184rpx;
  border-radius: 24rpx;
  background: #d9e5a6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.route-emoji {
  font-size: 72rpx;
}

.route-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.route-name {
  font-size: 32rpx;
  font-weight: 700;
}

.route-desc {
  font-size: 24rpx;
  color: #8f8b83;
  margin-top: 8rpx;
}
</style>
