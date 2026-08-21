/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展 uni 类型
declare namespace UniApp {
  interface Uni {
    $showToast: (message: string, type?: 'success' | 'error' | 'loading', duration?: number) => void
    $hideToast: () => void
  }
}
