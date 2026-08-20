// 宠物数据 - 从原 HTML 硬编码数据迁移
export interface Pet {
  id: string
  en: string
  cn: string
  kind: 'cat' | 'dog'
  breed: string
  tag: '野生' | '家养' | '天使'
  area: string
  xy: [number, number] | null
  stars: number
  seen: number
  collected: boolean
  hasUpdate?: boolean
  note: string
  trace: Array<{ t: string; p: string }>
  photo: string
  bodyColor: string
}

export const petsData: Pet[] = [
  {
    id: 'cat1',
    en: 'Catt',
    cn: '橘座',
    kind: 'cat',
    breed: '奶牛猫',
    tag: '野生',
    area: 'Block A 小区',
    xy: [76, 26],
    stars: 4,
    seen: 105,
    collected: true,
    note: '高冷贵族，只在午后的花坛边营业。',
    trace: [
      { t: '08:20', p: '花坛边晒太阳' },
      { t: '12:05', p: '便利店门口讨吃的' },
      { t: '14:40', p: '车棚顶上睡觉' }
    ],
    photo: '/static/pets/catt-1.jpg',
    bodyColor: '#b9b9b9'
  },
  {
    id: 'cat2',
    en: 'Memw',
    cn: '奶盖',
    kind: 'cat',
    breed: '三花猫',
    tag: '家养',
    area: 'Maple St 街',
    xy: [24, 62],
    stars: 4,
    seen: 76,
    collected: true,
    note: '见人就翻肚皮的社交悍匪，散养中。',
    trace: [
      { t: '09:10', p: '自家窗台' },
      { t: '13:30', p: '咪想咖啡门口' }
    ],
    photo: '/static/pets/memw-2.jpg',
    bodyColor: '#e79a5b'
  },
  {
    id: 'dog1',
    en: 'Dada',
    cn: '旺仔',
    kind: 'dog',
    breed: '小狗',
    tag: '家养',
    area: 'Riverside 河边',
    xy: [118, 128],
    stars: 3,
    seen: 35,
    collected: true,
    note: '河边散步搭子，尾巴摇成螺旋桨。',
    trace: [
      { t: '07:40', p: '河边晨跑' },
      { t: '16:00', p: '停狗处等主人' }
    ],
    photo: '/static/pets/dada-1.jpg',
    bodyColor: '#cf9a63'
  },
  {
    id: 'cat3',
    en: 'Onion',
    cn: '洋葱头',
    kind: 'cat',
    breed: '狸花猫',
    tag: '野生',
    area: '便利店',
    xy: [118, 36],
    stars: 3,
    seen: 35,
    collected: true,
    note: '躲在纸箱里，以为纸箱是隐身的。',
    trace: [{ t: '11:00', p: '便利店纸箱' }],
    photo: '/static/pets/onion-1.jpg',
    bodyColor: '#b3874e'
  },
  {
    id: 'cat4',
    en: 'Scar',
    cn: '刀疤',
    kind: 'cat',
    breed: '天使猫',
    tag: '天使',
    area: '老槐树下',
    xy: [50, 22],
    stars: 5,
    seen: 120,
    collected: true,
    note: '街区传奇。去年冬天去了喵星，大家还在老地方给它留吃的。',
    trace: [],
    photo: '/static/pets/scar-1.jpg',
    bodyColor: '#c3b3e0'
  },
  {
    id: 'cat5',
    en: 'Mochi',
    cn: '小萌萌',
    kind: 'cat',
    breed: '奶牛猫',
    tag: '野生',
    area: '公园',
    xy: [12, 112],
    stars: 3,
    seen: 14,
    collected: true,
    note: '小小的，圆圆的，一天睡 20 个小时。',
    trace: [{ t: '10:20', p: '公园长椅下' }],
    photo: '/static/pets/mochi-1.jpg',
    bodyColor: '#b9b9b9'
  }
]

// 品种对应的身体颜色
export const breedColors: Record<string, string> = {
  '奶牛猫': '#b9b9b9',
  '狸花猫': '#b3874e',
  '三花猫': '#e79a5b',
  '天使猫': '#c3b3e0',
  '长毛猫': '#8a6f52',
  '橘白猫': '#f0c789',
  '玳瑁猫': '#6b4f3a',
  '橘猫': '#e8963e',
  '小狗': '#cf9a63',
  '可卡犬': '#d9a86a',
  '边牧': '#4a4a4a'
}
