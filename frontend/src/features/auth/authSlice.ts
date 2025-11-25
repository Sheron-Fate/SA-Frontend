import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api'
import type { TypesLoginRequest, TypesRegisterRequest, TypesLogoutRequest } from '../../api/Api'

interface AuthState {
  username: string
  isAuthenticated: boolean
  isModerator: boolean
  error: string | null
}

// Загрузка начального состояния из localStorage
const loadInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      username: '',
      isAuthenticated: false,
      isModerator: false,
      error: null,
    }
  }

  // Проверяем наличие токена - если есть, считаем пользователя авторизованным
  const accessToken = localStorage.getItem('access_token')
  const username = localStorage.getItem('username') || ''
  const storedModerator = localStorage.getItem('is_moderator')

  return {
    username,
    isAuthenticated: !!accessToken,
    isModerator: storedModerator === 'true',
    error: null,
  }
}

const initialState: AuthState = loadInitialState()

// Асинхронное действие для авторизации
export const loginUserAsync = createAsyncThunk(
  'auth/loginUserAsync',
  async (credentials: TypesLoginRequest, { rejectWithValue }) => {
    try {
      const response = await api.api.authLoginCreate(credentials)
      return response.data
    } catch (error: any) {
      // Обрабатываем ошибку от API
      const errorMessage = error?.response?.data?.message || 'Ошибка авторизации'
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
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Получаем refresh токен из localStorage
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        const logoutRequest: TypesLogoutRequest = {
          refresh_token: refreshToken,
        }
        await api.api.authLogoutCreate(logoutRequest)
      }

      // Очищаем токены из localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')

      return null
    } catch (error: any) {
      // Даже если ошибка, очищаем токены локально
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')

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
        state.error = null

        // Сохраняем токены и username в localStorage
        if (access_token) {
          localStorage.setItem('access_token', access_token)
        }
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token)
        }
        if (user?.login) {
          localStorage.setItem('username', user.login)
        }
        localStorage.setItem('is_moderator', String(Boolean(user?.is_moderator)))

        // Отключаем мок-режим после успешной авторизации
        localStorage.removeItem('spectro_mock_mode')
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
        state.error = null

        // Сохраняем токены и username в localStorage
        if (access_token) {
          localStorage.setItem('access_token', access_token)
        }
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token)
        }
        if (user?.login) {
          localStorage.setItem('username', user.login)
        }
        localStorage.setItem('is_moderator', String(Boolean(user?.is_moderator)))

        // Отключаем мок-режим после успешной регистрации
        localStorage.removeItem('spectro_mock_mode')
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
        state.error = null
        // Очищаем username из localStorage
        localStorage.removeItem('username')
        localStorage.removeItem('is_moderator')
      })
      .addCase(logoutUserAsync.rejected, (state, action) => {
        // Даже при ошибке выхода, очищаем состояние
        state.username = ''
        state.isAuthenticated = false
        state.isModerator = false
        state.error = action.payload as string
        // Очищаем username из localStorage
        localStorage.removeItem('username')
        localStorage.removeItem('is_moderator')
      })
  },
})

export default authSlice.reducer
