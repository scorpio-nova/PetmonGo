// 时间工具函数

// UTC 时间字符串 → 本地时间显示
export function formatLocalTime(utcString: string): string {
  const date = new Date(utcString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// UTC 时间字符串 → 相对时间（如"3小时前"）
export function formatRelativeTime(utcString: string): string {
  const date = new Date(utcString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatLocalTime(utcString)
}

// UTC 时间字符串 → 日期部分（如"2024-01-15"）
export function formatDate(utcString: string): string {
  const date = new Date(utcString)
  return date.toISOString().split('T')[0]
}

// UTC 时间字符串 → 时间部分（如"14:30"）
export function formatTime(utcString: string): string {
  const date = new Date(utcString)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 获取当前 UTC ISO 字符串
export function nowISO(): string {
  return new Date().toISOString()
}
