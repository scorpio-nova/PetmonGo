// 相遇记录相关 API

import { callCloud } from '@/utils/cloud'

export interface AddEncounterParams {
  petId: string
  photo?: string
  note?: string
}

// 记录相遇
export async function addEncounter(data: AddEncounterParams): Promise<string | null> {
  const res = await callCloud<{ encounterId: string }>('addEncounter', data)
  if (res.code === 0 && res.data) {
    return res.data.encounterId
  }
  return null
}
