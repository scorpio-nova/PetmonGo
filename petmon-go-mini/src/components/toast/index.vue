<template>
  <view class="toast-overlay" v-if="visible" @click="hide">
    <view class="toast-container" :class="[type]">
      <text class="toast-icon" v-if="type === 'success'">✓</text>
      <text class="toast-icon" v-else-if="type === 'error'">✕</text>
      <text class="toast-icon loading" v-else>◎</text>
      <text class="toast-text">{{ message }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref<'success' | 'error' | 'loading'>('success')

let timer: ReturnType<typeof setTimeout> | null = null

function show(msg: string, toastType: 'success' | 'error' | 'loading' = 'success', duration = 2000) {
  message.value = msg
  type.value = toastType
  visible.value = true

  if (timer) clearTimeout(timer)
  if (duration > 0) {
    timer = setTimeout(() => {
      hide()
    }, duration)
  }
}

function hide() {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

// 暴露方法给父组件
defineExpose({ show, hide })
</script>

<style lang="scss" scoped>
.toast-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: none;
}

.toast-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 32rpx 48rpx;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 24rpx;
  min-width: 200rpx;
  max-width: 400rpx;
}

.toast-icon {
  font-size: 64rpx;
  color: #fff;
}

.toast-icon.loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.toast-text {
  font-size: 32rpx;
  color: #fff;
  text-align: center;
  word-break: break-all;
}
</style>
