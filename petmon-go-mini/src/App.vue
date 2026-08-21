<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { ref } from "vue";

// Toast 状态
const toastVisible = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "loading">("success");
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// 全局 Toast 方法
function showToast(message: string, type: "success" | "error" | "loading" = "success", duration = 2000) {
  toastMessage.value = message;
  toastType.value = type;
  toastVisible.value = true;

  if (toastTimer) clearTimeout(toastTimer);
  if (duration > 0) {
    toastTimer = setTimeout(() => {
      hideToast();
    }, duration);
  }
}

function hideToast() {
  toastVisible.value = false;
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

// 挂载到全局
uni.$showToast = showToast;
uni.$hideToast = hideToast;

onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>

<template>
  <view class="app">
    <slot />
    <!-- 全局 Toast -->
    <view class="toast-overlay" v-if="toastVisible" @click="hideToast">
      <view class="toast-container">
        <text class="toast-icon" v-if="toastType === 'success'">✓</text>
        <text class="toast-icon" v-else-if="toastType === 'error'">✕</text>
        <text class="toast-icon loading" v-else>◎</text>
        <text class="toast-text">{{ toastMessage }}</text>
      </view>
    </view>
  </view>
</template>

<style>
/* 全局样式 */
page {
  background: #fffdf8;
}

/* Toast 样式 */
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
