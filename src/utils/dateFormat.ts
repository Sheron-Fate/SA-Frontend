/**
 * Конвертирует дату из формата ДД.ММ.ГГГГ в RFC3339 формат для API
 * RFC3339: YYYY-MM-DDTHH:mm:ssZ (например: 2025-10-12T00:00:00Z)
 */
export const formatDateForApi = (ddmmyyyy: string | null): string | null => {
  if (!ddmmyyyy) return null

  // Убираем пробелы и разбиваем по точке
  const trimmed = ddmmyyyy.trim()
  const parts = trimmed.split('.').map(p => p.trim()).filter(p => p)

  if (parts.length !== 3) return null

  const dayStr = parts[0]
  const monthStr = parts[1]
  const yearStr = parts[2]

  // Проверяем, что все части состоят только из цифр
  if (!/^\d+$/.test(dayStr) || !/^\d+$/.test(monthStr) || !/^\d+$/.test(yearStr)) {
    return null
  }

  const day = parseInt(dayStr, 10)
  const month = parseInt(monthStr, 10)
  const year = parseInt(yearStr, 10)

  // Проверяем валидность диапазонов
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  if (year < 1900 || year > 2100) return null

  // Создаем объект Date в UTC для начала дня
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

  // Проверяем валидность даты (не была автоматически скорректирована)
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1 || date.getUTCFullYear() !== year) {
    return null // Невалидная дата (например, 31 февраля)
  }

  // Форматируем в RFC3339 (ISO 8601)
  return date.toISOString()
}

/**
 * Конвертирует дату из формата YYYY-MM-DD в ДД.ММ.ГГГГ
 */
export const formatDateFromApi = (yyyymmdd: string | null): string | null => {
  if (!yyyymmdd) return null
  const parts = yyyymmdd.split('-')
  if (parts.length !== 3) return null
  const [year, month, day] = parts
  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`
}

/**
 * Конвертирует дату из ISO формата (YYYY-MM-DD или полный ISO) в ДД.ММ.ГГГГ
 */
export const formatDateToDisplay = (isoDate: string | null | undefined): string => {
  if (!isoDate) return ''
  try {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return ''
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  } catch {
    return ''
  }
}
