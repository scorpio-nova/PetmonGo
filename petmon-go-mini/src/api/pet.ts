// 宠物相关 API

import { callCloud } from '@/utils/cloud'

export interface Pet {
  _id: string
  name: string
  cnName: string
  kind: 'cat' | 'dog'
  breed: string
  tag: string
  area: string
  stars: number
  seen: number
  note: string
  photo: string
  traces: Trace[]
  createdAt: string
}

export interface Trace {
  timestamp: string
  place: string
  area: string
  location?: {
    type: string
    coordinates: number[]
  }
}

export interface GetPetsParams {
  area?: string
  page?: number
  pageSize?: number
}

export interface GetPetsResult {
  list: Pet[]
  total: number
  page: number
  pageSize: number
}

export interface AddPetParams {
  name: string
  kind: 'cat' | 'dog'
  breed: string
  tag: string
  area: string
  note?: string
  photo?: string
  location?: {
    type: string
    coordinates: number[]
  }
}

// 获取宠物列表
export async function getPets(params: GetPetsParams = {}): Promise<GetPetsResult | null> {
  const res = await callCloud<GetPetsResult>('getPets', params)
  if (res.code === 0 && res.data) {
    return res.data
  }
  return null
}

// 创建宠物
export async function addPet(data: AddPetParams): Promise<string | null> {
  const res = await callCloud<{ petId: string }>('addPet', data)
  if (res.code === 0 && res.data) {
    return res.data.petId
  }
  return null
}
