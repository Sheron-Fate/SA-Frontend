import { API_BASE_URL, IS_TAURI } from '../config/target'

/**
 * Преобразует относительный путь API в корректный URL
 * В вебе возвращает относительный путь (проксируется Vite), в Tauri — полный URL
 */
export const buildApiUrl = (path: string): string => {
  const normalized = path.startsWith('/api') ? path : `/api${path}`
  if (IS_TAURI) {
    return `${API_BASE_URL}${normalized}`
  }
  return normalized
}
