// 安全事件数据
export interface Event {
  id: string
  type: '虐猫' | '丢失' | '抓人' | '咬人'
  title: string
  place: string
  time: string
  by: string
  desc: string
}

export const eventsData: Event[] = [
  {
    id: 'e1',
    type: '丢失',
    title: '小白走丢了',
    place: 'Maple St 街角',
    time: '2 小时前',
    by: 'Momo',
    desc: '白色田园猫，戴蓝色项圈，胆子小。昨晚从 3 号楼窗户跑出去，最后出现在街角便利店附近。'
  },
  {
    id: 'e2',
    type: '抓人',
    title: '花坛边有猫抓人',
    place: 'Block A 花坛',
    time: '昨天',
    by: '楼下阿姨',
    desc: '花坛边的狸花最近护崽，有小朋友伸手被抓了一下。逗猫请保持距离。'
  }
]

// 事件警告文案
export function getWarnCopy(type: Event['type']): string {
  if (type === '虐猫') return '警惕：该区域出现疑似虐猫行为。请留意可疑人员，优先保证自身安全。'
  if (type === '丢失') return '宠物丢失：请大家帮忙留意。如果偶遇 TA，请不要追赶，先拍照上传位置。'
  if (type === '抓人') return '提醒：该区域有猫抓人记录。逗猫请保持距离，不要伸手摸肚皮。'
  return '提醒：该区域有狗咬人记录。遛狗请牵绳戴嘴套，路过请勿奔跑挑逗。'
}
