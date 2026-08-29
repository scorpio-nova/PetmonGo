// 事件相关 API

import { callCloud } from '@/utils/cloud'

export type EventType = '虐猫' | '丢失' | '抓人' | '咬人'

export interface AddEventParams {
  type: EventType
  title: string
  desc?: string
  place: string
  location?: {
    type: string
    coordinates: number[]
  }
}

// 发布事件
export async function addEvent(data: AddEventParams): Promise<string | null> {
  const res = await callCloud<{ eventId: string }>('addEvent', data)
  if (res.code === 0 && res.data) {
    return res.data.eventId
  }
  return null
}
