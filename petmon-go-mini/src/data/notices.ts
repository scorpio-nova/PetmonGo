// 消息通知数据
export interface Notice {
  id: string
  icon: string
  bg: string
  title: string
  body: string
  unread: boolean
}

export const noticesData: Notice[] = [
  {
    id: 'n1',
    icon: 'catfood',
    bg: '#fff8e2',
    title: 'Memw 收到新投喂',
    body: 'Mille 在咪想咖啡门口留下小鱼干',
    unread: false
  },
  {
    id: 'n2',
    icon: 'label',
    bg: '#eef4dc',
    title: '图鉴有新动态',
    body: 'Catt 今天 14:40 出现在车棚顶',
    unread: false
  },
  {
    id: 'n3',
    icon: 'water',
    bg: '#e8f4ff',
    title: '附近补水点更新',
    body: 'Riverside 新增可用水碗',
    unread: false
  }
]
