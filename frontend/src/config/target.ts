const isBrowser = typeof window !== 'undefined'
const isTauriRuntime =
  (typeof window !== 'undefined' && Boolean((window as any).__TAURI__)) ||
  Boolean(import.meta.env.TAURI_PLATFORM) ||
  import.meta.env.TAURI_ENV_PLATFORM !== undefined

const fallbackApiUrl = 'http://192.168.0.101:8080/api'
const fallbackMinioUrl = 'http://192.168.0.101:9000'

const tauriApiUrl = import.meta.env.VITE_TAURI_API_URL || fallbackApiUrl
const webApiUrl = '/api'

const tauriMinioUrl =
  import.meta.env.VITE_TAURI_MINIO_BASE_URL ||
  import.meta.env.VITE_MINIO_BASE_URL ||
  fallbackMinioUrl
const webMinioUrl = import.meta.env.VITE_MINIO_BASE_URL || ''

const normalizeBase = (value: string | null | undefined) =>
  value ? value.replace(/\/$/, '') : ''

export const IS_TAURI = isTauriRuntime
export const API_BASE_URL = normalizeBase(IS_TAURI ? tauriApiUrl : webApiUrl)
export const MINIO_BASE_URL = normalizeBase(IS_TAURI ? tauriMinioUrl : webMinioUrl)
export const USE_PROXY_IMAGES = !IS_TAURI
