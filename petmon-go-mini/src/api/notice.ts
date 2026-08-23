// 通知相关 API

import { callCloud } from '@/utils/cloud'

export interface Notice {
  _id: string
  type: string
  title: string
  body: string
  relatedId: string
  read: boolean
  createdAt: string
}

export interface GetNoticesParams {
  page?: number
  pageSize?: number
}

export interface GetNoticesResult {
  list: Notice[]
  total: number
  page: number
  pageSize: number
}

// 获取通知列表
export async function getNotifications(params: GetNoticesParams = {}): Promise<GetNoticesResult | null> {
  const res = await callCloud<GetNoticesResult>('getNotifications', params)
  if (res.code === 0 && res.data) {
    return res.data
  }
  return null
}
