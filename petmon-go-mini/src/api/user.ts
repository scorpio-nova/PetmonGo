// 用户相关 API

import { callCloud, setUserInfo } from '@/utils/cloud'

export interface UserInfo {
  _id: string
  _openid: string
  nickName: string
  avatarUrl: string
  bio: string
  feeds: number
  collectedCount: number
  spots: number
  activeDays: number
  createdAt: string
  updatedAt: string
}

export interface LoginResult {
  userInfo: UserInfo
  isNewUser: boolean
}

// 登录
export async function login(): Promise<LoginResult | null> {
  const res = await callCloud<LoginResult>('login')
  if (res.code === 0 && res.data) {
    setUserInfo(res.data.userInfo)
    return res.data
  }
  return null
}

// 检查登录状态
export function isLoggedIn(): boolean {
  return !!uni.getStorageSync('userInfo')
}

// 获取本地用户信息
export function getLocalUserInfo(): UserInfo | null {
  return uni.getStorageSync('userInfo') || null
}
