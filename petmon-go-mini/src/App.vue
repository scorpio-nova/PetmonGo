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

  // 微信小程序不支持网页里的远程 @font-face；尝试通过运行时 API
  // 加载字体，失败时由 CSS fallback 保证文字仍然可见。
  const loadFontFace = (uni as any).loadFontFace as ((options: Record<string, any>) => void) | undefined;
  if (loadFontFace) {
    loadFontFace({
      family: 'Gaegu',
      source: 'url("https://fonts.gstatic.com/s/gaegu/v17/TuGSUVB6Up9NU57nifw74sdtBk0x.woff2")',
      global: true,
      fail: (err: unknown) => console.warn('Gaegu font unavailable, using fallback', err)
    });
    loadFontFace({
      family: 'Long Cang',
      source: 'url("https://fonts.gstatic.com/s/longcang/v20/LYjAdGP8kkQ-IF3dMPGP_kYZW8g.woff2")',
      global: true,
      fail: (err: unknown) => console.warn('Long Cang font unavailable, using fallback', err)
    });
  }

  // 初始化云开发
  if (wx.cloud) {
    wx.cloud.init({
      env: 'petmon-backend-d0gdzcyjw2d9f70ba',
      traceUser: true
    });
  }
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
  font-family: 'Gaegu', 'Long Cang', 'Chalkboard SE', 'Bradley Hand', cursive, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 手绘风格边框 */
.sketch-border {
  border: 5rpx solid #141414;
  border-radius: 24rpx;
  position: relative;
}

.sketch-border::before {
  content: '';
  position: absolute;
  inset: -2rpx;
  border: 3rpx solid #141414;
  border-radius: 26rpx;
  opacity: 0.3;
  pointer-events: none;
}

/* 浮动动画 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

.float-animation {
  animation: float 4.5s ease-in-out infinite;
}

/* 弹出动画 */
@keyframes pop {
  0% { transform: translateY(48rpx); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.pop-animation {
  animation: pop 0.25s ease-out;
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
