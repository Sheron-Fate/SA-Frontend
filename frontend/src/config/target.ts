const isTauriRuntime =
  (typeof window !== 'undefined' && Boolean((window as any).__TAURI__)) ||
  Boolean(import.meta.env.TAURI_PLATFORM) ||
  import.meta.env.TAURI_ENV_PLATFORM !== undefined

// Пути в Api.ts уже содержат /api, поэтому базовый URL не должен содержать /api
const fallbackApiUrl = 'http://172.20.10.3:8080'
const fallbackMinioUrl = 'http://172.20.10.3:9000'

const tauriApiUrl = import.meta.env.VITE_TAURI_API_URL || fallbackApiUrl
// Для веба используем '/', чтобы пути были относительными и проксировались через Vite
// Пути в Api.ts уже содержат /api/auth/login, которые будут проксироваться на http://localhost:8080
const webApiUrl = '/'

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
