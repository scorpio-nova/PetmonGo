// 云函数调用工具

export interface CloudResult<T = any> {
  code: number
  data?: T
  message?: string
}

// 调用云函数
export async function callCloud<T = any>(
  name: string,
  data?: Record<string, any>
): Promise<CloudResult<T>> {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data
    })
    return res.result as CloudResult<T>
  } catch (err) {
    console.error(`callCloud ${name} error:`, err)
    return {
      code: -1,
      message: (err as Error).message
    }
  }
}

// 检查登录状态
export function isLoggedIn(): boolean {
  return !!uni.getStorageSync('userInfo')
}

// 获取用户信息
export function getUserInfo() {
  return uni.getStorageSync('userInfo')
}

// 保存用户信息
export function setUserInfo(userInfo: any) {
  uni.setStorageSync('userInfo', userInfo)
}

// 清除用户信息
export function clearUserInfo() {
  uni.removeStorageSync('userInfo')
}
