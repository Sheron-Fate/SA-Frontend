import { Api, HttpClient } from './Api';
import { API_BASE_URL, IS_TAURI } from '../config/target';
import store from '../store';

// Создаем HTTP клиент с базовым URL
// Для веба: НЕ передаем baseURL (будет undefined), но переопределим после создания
// чтобы пути были относительными и проксировались через Vite
// Для Tauri: используем полный URL без /api (так как пути уже содержат /api)
// Создаем конфигурацию для HttpClient
const httpClientConfig: any = {
  securityWorker: async (securityData: any) => {
    // Получаем токен из Redux store
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return {};
  },
  secure: !IS_TAURI, // Для Tauri отключаем secure (используем HTTP), для веба включаем
}

// Для Tauri передаем полный URL, для веба не передаем baseURL вообще
// (переопределим после создания через instance.defaults)
if (IS_TAURI) {
  httpClientConfig.baseURL = API_BASE_URL
  console.log('[Tauri Debug] Setting baseURL to:', API_BASE_URL)
}

const httpClient = new HttpClient(httpClientConfig);

// Логирование для отладки Tauri
if (IS_TAURI) {
  console.log('[Tauri Debug] IS_TAURI:', IS_TAURI)
  console.log('[Tauri Debug] API_BASE_URL:', API_BASE_URL)
  console.log('[Tauri Debug] httpClientConfig.baseURL:', httpClientConfig.baseURL)
  console.log('[Tauri Debug] httpClient.instance.defaults.baseURL:', httpClient.instance.defaults.baseURL)

  // Убеждаемся, что baseURL установлен правильно после создания HttpClient
  if (httpClient.instance.defaults.baseURL !== API_BASE_URL) {
    httpClient.instance.defaults.baseURL = API_BASE_URL
    console.log('[Tauri Debug] Fixed baseURL to:', API_BASE_URL)
  }

  // Добавляем interceptor для логирования запросов в Tauri
  httpClient.instance.interceptors.request.use((config) => {
    const fullUrl = (config.baseURL || '') + (config.url || '')
    console.log('[Tauri Debug] Request method:', config.method)
    console.log('[Tauri Debug] Request path:', config.url)
    console.log('[Tauri Debug] Request baseURL:', config.baseURL)
    console.log('[Tauri Debug] Full URL:', fullUrl)
    console.log('[Tauri Debug] Headers:', config.headers)
    console.log('[Tauri Debug] Data:', config.data)
    return config
  })

  httpClient.instance.interceptors.response.use(
    (response) => {
      console.log('[Tauri Debug] Response success:', response.config.url, response.status)
      return response
    },
    (error) => {
      console.error('[Tauri Debug] Response error URL:', error.config?.url)
      console.error('[Tauri Debug] Error status:', error.response?.status)
      console.error('[Tauri Debug] Error status text:', error.response?.statusText)
      console.error('[Tauri Debug] Error data:', error.response?.data)
      console.error('[Tauri Debug] Error message:', error.message)
      if (error.code) {
        console.error('[Tauri Debug] Error code:', error.code)
      }
      return Promise.reject(error)
    }
  )
}

// Для веба переопределяем baseURL и добавляем interceptor для исправления URL
// Это необходимо, так как HttpClient имеет fallback на "//localhost:8080" в конструкторе
// Пути в Api.ts уже содержат /api/auth/login, которые будут проксироваться через Vite
if (!IS_TAURI) {
  httpClient.instance.defaults.baseURL = ''

  // Добавляем interceptor для исправления URL, если он содержит протокол-относительный URL
  httpClient.instance.interceptors.request.use((config) => {
    if (config.url && typeof config.url === 'string') {
      // Если URL начинается с //, заменяем на относительный путь
      if (config.url.startsWith('//')) {
        config.url = config.url.replace(/^\/\/[^/]+/, '')
      }
      // Если URL содержит https://localhost:8080, заменяем на относительный путь
      if (config.url.includes('localhost:8080')) {
        config.url = config.url.replace(/https?:\/\/localhost:8080/, '')
      }
    }
    return config
  })
}

// Создаем инстанс API
export const api = new Api(httpClient);

// Экспортируем httpClient для прямого использования
export { httpClient };

// Экспортируем типы для удобства
export type * from './Api';
