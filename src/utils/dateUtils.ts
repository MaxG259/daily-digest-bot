/**
 * Возвращает границы текущего периода дайджеста.
 * Период: вчера 17:00 UTC (20:00 МСК) → сегодня 17:00 UTC (20:00 МСК)
 */
export function getCurrentPeriod(): { start: Date; end: Date } {
  const now = new Date()

  // Конец периода — ближайшие прошедшие 17:00 UTC
  const end = new Date(now)
  end.setUTCHours(17, 0, 0, 0)

  // Если сейчас ещё не наступило 17:00 UTC сегодня — конец был вчера
  if (now < end) {
    end.setUTCDate(end.getUTCDate() - 1)
  }

  // Начало периода — ровно за 24 часа до конца
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 1)

  return { start, end }
}

/**
 * Форматирует дату для отображения в МСК
 */
export function formatDateMSK(date: Date): string {
  return date.toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })
}

/**
 * Форматирует время для отображения в МСК
 */
export function formatTimeMSK(date: Date): string {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  })
}
