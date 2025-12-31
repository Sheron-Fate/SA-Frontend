import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api'
import type { TypesLoginRequest, TypesRegisterRequest, TypesLogoutRequest } from '../../api/Api'

interface AuthState {
  username: string
  isAuthenticated: boolean
  isModerator: boolean
  accessToken: string | null
  refreshToken: string | null
  error: string | null
}

// Ключи для localStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USERNAME: 'auth_username',
  IS_MODERATOR: 'auth_is_moderator',
}

// Функции для работы с localStorage
const saveAuthToStorage = (accessToken: string | null, refreshToken: string | null, username: string, isModerator: boolean) => {
  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
  }
  if (username) {
    localStorage.setItem(STORAGE_KEYS.USERNAME, username)
  }
  localStorage.setItem(STORAGE_KEYS.IS_MODERATOR, String(isModerator))
}

const clearAuthFromStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USERNAME)
  localStorage.removeItem(STORAGE_KEYS.IS_MODERATOR)
}

// НЕ загружаем начальное состояние из localStorage - при обновлении страницы пользователь должен быть неавторизован
// Токены хранятся в localStorage, но Redux состояние не восстанавливается автоматически
const initialState: AuthState = {
  username: '',
  isAuthenticated: false,
  isModerator: false,
  accessToken: null,
  refreshToken: null,
  error: null,
}

// Асинхронное действие для авторизации
export const loginUserAsync = createAsyncThunk(
  'auth/loginUserAsync',
  async (credentials: TypesLoginRequest, { rejectWithValue }) => {
    try {
      console.log('[Tauri Debug] Attempting login with:', credentials.login)
      const response = await api.api.authLoginCreate(credentials)
      console.log('[Tauri Debug] Login response:', response)
      return response.data
    } catch (error: any) {
      // Обрабатываем ошибку от API
      console.error('[Tauri Debug] Login error:', error)
      console.error('[Tauri Debug] Error response:', error?.response)
      console.error('[Tauri Debug] Error message:', error?.message)
      const errorMessage = error?.response?.data?.message || error?.message || 'Ошибка авторизации'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для регистрации
export const registerUserAsync = createAsyncThunk(
  'auth/registerUserAsync',
  async (credentials: TypesRegisterRequest, { rejectWithValue }) => {
    try {
      const response = await api.api.authRegisterCreate(credentials)
      return response.data
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Ошибка регистрации'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для деавторизации
export const logoutUserAsync = createAsyncThunk(
  'auth/logoutUserAsync',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state: any = getState()
      const refreshToken = state.auth.refreshToken

      if (refreshToken) {
        const logoutRequest: TypesLogoutRequest = {
          refresh_token: refreshToken,
        }
        await api.api.authLogoutCreate(logoutRequest)
      }

      return null
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Ошибка при выходе из системы'
      return rejectWithValue(errorMessage)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Обработка loginUserAsync
      .addCase(loginUserAsync.pending, (state) => {
        state.error = null
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        const { user, access_token, refresh_token } = action.payload
        state.username = user?.login || ''
        state.isAuthenticated = true
        state.isModerator = Boolean(user?.is_moderator)
        state.accessToken = access_token || null
        state.refreshToken = refresh_token || null
        state.error = null
        // Сохраняем в localStorage
        saveAuthToStorage(access_token || null, refresh_token || null, user?.login || '', Boolean(user?.is_moderator))
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.error = action.payload as string
        state.isAuthenticated = false
      })

      // Обработка registerUserAsync
      .addCase(registerUserAsync.pending, (state) => {
        state.error = null
      })
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        const { user, access_token, refresh_token } = action.payload
        state.username = user?.login || ''
        state.isAuthenticated = true
        state.isModerator = Boolean(user?.is_moderator)
        state.accessToken = access_token || null
        state.refreshToken = refresh_token || null
        state.error = null
        // Сохраняем в localStorage
        saveAuthToStorage(access_token || null, refresh_token || null, user?.login || '', Boolean(user?.is_moderator))
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.error = action.payload as string
        state.isAuthenticated = false
      })

      // Обработка logoutUserAsync
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.username = ''
        state.isAuthenticated = false
        state.isModerator = false
        state.accessToken = null
        state.refreshToken = null
        state.error = null
        // Очищаем localStorage
        clearAuthFromStorage()
      })
      .addCase(logoutUserAsync.rejected, (state, action) => {
        // Даже при ошибке выхода, очищаем состояние
        state.username = ''
        state.isAuthenticated = false
        state.isModerator = false
        state.accessToken = null
        state.refreshToken = null
        state.error = action.payload as string
        // Очищаем localStorage
        clearAuthFromStorage()
      })
  },
})

export default authSlice.reducer
