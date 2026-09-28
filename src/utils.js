// History item scoring:
// - Frequency (bought often) pushes UP
// - Recently eaten pushes DOWN temporarily
export function historyScore(item) {
  const count = item.count || 0
  const daysSinceEaten = item.lastEatenAt
    ? (Date.now() - item.lastEatenAt) / 86400000
    : 999

  const base = Math.min(count * 3, 30)
  const penalty =
    daysSinceEaten < 1  ? 25 :
    daysSinceEaten < 3  ? 15 :
    daysSinceEaten < 7  ? 8  :
    daysSinceEaten < 14 ? 3  : 0

  return base - penalty
}

export function formatRelativeDate(timestamp) {
  if (!timestamp) return null
  const diff = Math.floor((Date.now() - timestamp) / 86400000)
  if (diff === 0) return 'сегодня'
  if (diff === 1) return 'вчера'
  if (diff < 7) return `${diff} дн. назад`
  return new Date(timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
