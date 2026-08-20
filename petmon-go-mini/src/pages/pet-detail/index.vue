<template>
  <view class="container" v-if="pet">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <text class="back-arrow">←</text>
      </view>
      <text class="nav-subtitle">宠物档案 · read only</text>
    </view>

    <!-- 宠物详情 -->
    <scroll-view class="detail-content" scroll-y>
      <!-- 宠物照片 -->
      <view class="photo-section">
        <view class="photo-frame">
          <image
            class="pet-photo"
            :src="pet.photo"
            mode="aspectFill"
          />
        </view>
      </view>

      <!-- 宠物信息 -->
      <view class="info-section">
        <view class="name-row">
          <text class="pet-en">{{ pet.en }}</text>
          <text class="pet-cn">{{ pet.cn }}</text>
          <view class="pet-tag">{{ pet.tag }}</view>
        </view>

        <view class="stats-row">
          <text class="pet-stars">{{ getStarStr(pet.stars) }}</text>
          <text class="pet-stats">被偶遇 {{ pet.seen }}× · {{ pet.area }}</text>
        </view>

        <text class="pet-note">{{ pet.note }}</text>
      </view>

      <!-- 今日踪迹 -->
      <view class="trace-section" v-if="pet.trace && pet.trace.length">
        <text class="section-title">今日踪迹 · today</text>
        <view
          v-for="(t, i) in pet.trace"
          :key="i"
          class="trace-item"
        >
          <view class="trace-dot" />
          <text class="trace-time">{{ t.t }}</text>
          <text class="trace-place">{{ t.p }}</text>
        </view>
      </view>

      <!-- 天使宠物入口 -->
      <view class="angel-section" v-if="pet.tag === '天使'">
        <view class="angel-card">
          <text class="angel-icon">😇</text>
          <view class="angel-info">
            <text class="angel-title">天使宠物 · angel</text>
            <text class="angel-desc">TA 去了喵星 · 给 TA 留个小礼物吧</text>
          </view>
          <text class="angel-arrow">›</text>
        </view>
      </view>

      <!-- 确认是TA按钮 -->
      <view class="action-section" v-if="pet.tag !== '天使'">
        <view class="confirm-btn" @click="confirmPet">
          <text class="confirm-text">确认是 TA · 上传相遇 ➜</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { petsData, type Pet } from '@/data/pets'

const pet = ref<Pet | null>(null)

// 星级字符串
function getStarStr(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(5 - stars)
}

// 返回上一页
function goBack() {
  uni.navigateBack()
}

// 确认是TA
function confirmPet() {
  uni.navigateTo({
    url: `/pages/upload/index?id=${pet.value?.id}`
  })
}

onLoad((options) => {
  if (options?.id) {
    pet.value = petsData.find(p => p.id === options.id) || null
  }
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

.detail-content {
  padding: 12rpx 52rpx 56rpx;
}

.photo-section {
  display: flex;
  justify-content: center;
  margin-top: 12rpx;
}

.photo-frame {
  position: relative;
  width: 420rpx;
  height: 380rpx;
  padding: 16rpx;
}

.photo-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 14rpx solid #141414;
  border-radius: 18rpx;
}

.pet-photo {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.info-section {
  margin-top: 28rpx;
}

.name-row {
  display: flex;
  align-items: baseline;
  gap: 20rpx;
}

.pet-en {
  font-size: 64rpx;
  font-weight: 700;
  line-height: 1;
}

.pet-cn {
  font-size: 42rpx;
  color: #8f8b83;
}

.pet-tag {
  font-size: 26rpx;
  font-weight: 700;
  border: 5rpx solid #141414;
  border-radius: 18rpx;
  padding: 0 16rpx;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 8rpx;
}

.pet-stars {
  font-size: 38rpx;
  letter-spacing: 4rpx;
}

.pet-stats {
  font-size: 28rpx;
  color: #8f8b83;
}

.pet-note {
  font-size: 34rpx;
  color: #3a3a3a;
  line-height: 1.4;
  margin-top: 12rpx;
}

.trace-section {
  margin-top: 32rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.trace-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 10rpx 0;
}

.trace-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #141414;
  flex-shrink: 0;
}

.trace-time {
  font-size: 32rpx;
  font-weight: 700;
  width: 104rpx;
}

.trace-place {
  font-size: 32rpx;
  color: #3a3a3a;
}

.angel-section {
  margin-top: 32rpx;
}

.angel-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 32rpx;
  background: #fff8e2;
  border: 10rpx solid #141414;
  border-radius: 20rpx;
}

.angel-icon {
  font-size: 88rpx;
}

.angel-info {
  flex: 1;
}

.angel-title {
  font-size: 36rpx;
  font-weight: 700;
}

.angel-desc {
  font-size: 28rpx;
  color: #8f8b83;
}

.angel-arrow {
  font-size: 40rpx;
  color: #8f8b83;
}

.action-section {
  margin-top: 40rpx;
}

.confirm-btn {
  background: #141414;
  color: #fff;
  border-radius: 36rpx;
  padding: 26rpx 0;
  text-align: center;
}

.confirm-text {
  font-size: 40rpx;
  font-weight: 700;
}
</style>
