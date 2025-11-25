import { Api, HttpClient } from './Api';
import { API_BASE_URL, IS_TAURI } from '../config/target';

// Создаем HTTP клиент с базовым URL
// Для веба: НЕ передаем baseURL (будет undefined), но переопределим после создания
// чтобы пути были относительными и проксировались через Vite
// Для Tauri: используем полный URL без /api (так как пути уже содержат /api)
// Создаем конфигурацию для HttpClient
const httpClientConfig: any = {
  securityWorker: async (securityData: any) => {
    // Получаем токен из localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        return {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      }
    }
    return {};
  },
  secure: true, // По умолчанию используем secure для всех запросов
}

// Для Tauri передаем полный URL, для веба не передаем baseURL вообще
// (переопределим после создания через instance.defaults)
if (IS_TAURI) {
  httpClientConfig.baseURL = API_BASE_URL
}

const httpClient = new HttpClient(httpClientConfig);

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

// Экспортируем типы для удобства
export type * from './Api';
