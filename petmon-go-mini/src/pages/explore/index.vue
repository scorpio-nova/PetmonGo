<template>
  <view class="container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-title">
        <text class="app-name">petmon go</text>
      </view>
    </view>

    <!-- 两列瀑布流探索内容 -->
    <scroll-view class="explore-content" scroll-y>
      <view class="waterfall">
        <view v-for="(column, columnIndex) in feedColumns" :key="columnIndex" class="waterfall-column">
          <view
            v-for="item in column"
            :key="item.id"
            class="feed-card"
            @click="openFeedItem(item)"
          >
            <view class="feed-cover" :style="{ backgroundColor: item.coverColor }">
              <image v-if="item.cover" class="feed-image" :src="item.cover" mode="aspectFill" />
              <text v-else class="feed-cover-icon">{{ item.icon }}</text>
            </view>
            <text class="feed-title">{{ item.title }}</text>
            <view class="feed-footer">
              <text class="feed-account">{{ item.account }}</text>
              <view class="favorite-btn" @click.stop="toggleFavorite(item.id)">
                <text class="favorite-icon">{{ isFavorite(item.id) ? '♥' : '♡' }}</text>
                <text class="favorite-count">{{ item.favorites + (isFavorite(item.id) ? 1 : 0) }}</text>
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
import { eventsData } from '@/data/events'
import { getPetPhoto, loadPetPhotos } from '@/utils/pet-photo'

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

const photoOverrides = ref<Record<string, string>>({})
const favoriteIds = ref<string[]>([])

interface FeedItem {
  id: string
  cover: string
  coverColor: string
  icon: string
  title: string
  account: string
  favorites: number
  eventId?: string
  petId?: string
}

function photoFor(pet: (typeof petsData)[number]): string {
  return getPetPhoto(pet, photoOverrides.value)
}

function photoForId(id: string): string {
  const pet = petsData.find(item => item.id === id)
  return pet ? photoFor(pet) : ''
}

const feedItems = computed<FeedItem[]>(() => [
  ...petsData.filter(p => p.collected).slice(0, 4).map(pet => ({
    id: `pet-${pet.id}`,
    cover: photoFor(pet),
    coverColor: '#e9e4d8',
    icon: '🐾',
    title: `${pet.cn} · ${pet.en} 的街区日常`,
    account: `@${pet.en.toLowerCase()}`,
    favorites: pet.seen
  })),
  ...eventsData.map(event => ({
    id: `event-${event.id}`,
    cover: '',
    coverColor: event.type === '丢失' ? '#f5d35f' : '#f1b5a5',
    icon: '⚠️',
    title: event.title,
    account: `@${event.by}`,
    favorites: 12,
    eventId: event.id
  })),
  {
    id: 'log-catt',
    cover: photoForId('cat1'),
    coverColor: '#e9e4d8',
    icon: '🐾',
    title: 'Catt 今天在花坛边晒肚皮',
    account: '@Momo',
    favorites: 28,
    petId: 'cat1'
  },
  {
    id: 'angel-scar',
    cover: photoForId('cat4'),
    coverColor: '#fff0bf',
    icon: '😇',
    title: '刀疤的街区故事',
    account: '@楼下阿姨',
    favorites: 36,
    petId: 'cat4'
  },
  {
    id: 'place-cafe',
    cover: '',
    coverColor: '#e4d9c8',
    icon: '☕',
    title: '咪想咖啡：可以带毛孩子来',
    account: '@街区探店',
    favorites: 22
  },
  {
    id: 'walk-route',
    cover: '',
    coverColor: '#d9e5a6',
    icon: '🚶',
    title: '河边慢走圈 · 2.1 km',
    account: '@遛宠小组',
    favorites: 18
  }
])

const feedColumns = computed(() => [
  feedItems.value.filter((_, index) => index % 2 === 0),
  feedItems.value.filter((_, index) => index % 2 === 1)
])

function isFavorite(id: string): boolean {
  return favoriteIds.value.includes(id)
}

function toggleFavorite(id: string) {
  favoriteIds.value = isFavorite(id)
    ? favoriteIds.value.filter(itemId => itemId !== id)
    : [...favoriteIds.value, id]
}

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

function openFeedItem(item: (typeof feedItems.value)[number]) {
  if (item.eventId) {
    openEventDetail(item.eventId)
  } else if (item.petId) {
    openPetDetail(item.petId)
  }
}

// 获取当前时间
function updateTime() {
  const now = new Date()
  currentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 60000)
  void loadPetPhotos([...petsData.filter(pet => pet.collected)]).then((photos) => {
    photoOverrides.value = photos
  })
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
  font-family: 'Petmon Gaegu', 'Petmon Long Cang', cursive;
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
  width: 152rpx;
}

.pet-avatar-wrapper {
  position: relative;
  width: 128rpx;
  height: 128rpx;
}

.pet-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid #141414;
}

.pet-name {
  font-size: 30rpx;
  font-weight: 700;
}

.event-swiper {
  width: 100%;
  height: 410rpx;
}

.event-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 410rpx;
  padding: 0 28rpx 28rpx;
  background: #fff;
  border: 4rpx solid #141414;
  border-radius: 28rpx;
  box-sizing: border-box;
}

.event-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% + 56rpx);
  height: 250rpx;
  margin: 0 -28rpx 24rpx;
  background: #f5d35f;
  border-radius: 24rpx 24rpx 0 0;
}

.event-icon {
  font-size: 76rpx;
}

.event-info {
  width: 100%;
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
  position: absolute;
  top: 20rpx;
  right: 20rpx;
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
  position: absolute;
  right: 28rpx;
  bottom: 22rpx;
  font-size: 40rpx;
  color: #8f8b83;
}

.log-card {
  position: relative;
  display: flex;
  gap: 24rpx;
  padding: 20rpx;
  background: #fff;
  border: 4rpx solid #141414;
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
  border: 4rpx solid #141414;
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
  border: 4rpx solid #141414;
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
  border: 4rpx solid #141414;
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

/* 小红书式双列瀑布流 */
.explore-content {
  padding: 12rpx 24rpx 48rpx;
  box-sizing: border-box;
  overflow-x: hidden;
}

.waterfall {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.waterfall-column {
  flex: 1;
  min-width: 0;
}

.feed-card {
  width: 100%;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 0 3rpx 0 rgba(20, 20, 20, 0.08);
}

.feed-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 260rpx;
  overflow: hidden;
}

.feed-image {
  width: 100%;
  height: 100%;
}

.feed-cover-icon {
  font-size: 76rpx;
}

.feed-title {
  display: block;
  padding: 14rpx 16rpx 0;
  font-size: 29rpx;
  font-weight: 700;
  line-height: 1.3;
}

.feed-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  padding: 12rpx 16rpx 0;
}

.feed-account {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #8f8b83;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-btn {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: #8f8b83;
}

.favorite-icon {
  color: #e36b67;
  font-size: 30rpx;
  line-height: 1;
}

.favorite-count {
  margin-left: 4rpx;
  font-size: 22rpx;
}
</style>
