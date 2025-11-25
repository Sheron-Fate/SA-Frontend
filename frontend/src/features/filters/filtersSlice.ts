import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Pigment, PigmentsResult } from '../../types/pigment'
import { PIGMENTS_MOCK } from '../../data/mockPigments'
import { API_BASE_URL, IS_TAURI } from '../../config/target'
import { logoutUserAsync } from '../auth/authSlice'

export interface DateRange {
  from: string | null
  to: string | null
}

export interface PriceRange {
  min: number | null
  max: number | null
}

export interface FiltersState {
  search: string
  color: string
  dateRange: DateRange
  priceRange: PriceRange
  lastUpdated: number | null
  pigments: Pigment[]
  loading: boolean
}

export const FILTERS_STORAGE_KEY = 'spectro_filters_v1'

const DEFAULT_STATE: FiltersState = {
  search: '',
  color: '',
  dateRange: { from: null, to: null },
  priceRange: { min: null, max: null },
  lastUpdated: null,
  pigments: [],
  loading: false,
}

const loadInitialState = (): FiltersState => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_STATE }
  }

  try {
    const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_STATE }
    }

    const parsed = JSON.parse(raw) as Partial<FiltersState>
    // Восстанавливаем только фильтры, но не pigments и loading
    return {
      ...DEFAULT_STATE,
      search: parsed?.search ?? DEFAULT_STATE.search,
      color: parsed?.color ?? DEFAULT_STATE.color,
      dateRange: {
        from: parsed?.dateRange?.from ?? DEFAULT_STATE.dateRange.from,
        to: parsed?.dateRange?.to ?? DEFAULT_STATE.dateRange.to,
      },
      priceRange: {
        min: parsed?.priceRange?.min ?? DEFAULT_STATE.priceRange.min,
        max: parsed?.priceRange?.max ?? DEFAULT_STATE.priceRange.max,
      },
      lastUpdated: parsed?.lastUpdated ?? DEFAULT_STATE.lastUpdated,
      // pigments и loading всегда пустые при загрузке
      pigments: [],
      loading: false,
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

const touch = (state: FiltersState) => {
  state.lastUpdated = Date.now()
}

// Функция для фильтрации mock данных (fallback при ошибке)
const filterPigmentsMock = (filters: { search: string; color: string; dateFrom: string | null; dateTo: string | null }): Pigment[] => {
  let filtered = PIGMENTS_MOCK

  if (filters.search) {
    const lowered = filters.search.toLowerCase()
    filtered = filtered.filter(
      (pigment) =>
        pigment.name.toLowerCase().includes(lowered) ||
        pigment.brief.toLowerCase().includes(lowered)
    )
  }

  if (filters.color) {
    const loweredColor = filters.color.toLowerCase()
    filtered = filtered.filter(
      (pigment) => (pigment.color || '').toLowerCase().includes(loweredColor)
    )
  }

  if (filters.dateFrom || filters.dateTo) {
    filtered = filtered.filter((pigment) => {
      if (!pigment.created_at) return false
      const createdAt = new Date(pigment.created_at)
      if (Number.isNaN(createdAt.getTime())) return false

      if (filters.dateFrom) {
        const fromDate = new Date(`${filters.dateFrom}T00:00:00Z`)
        if (createdAt < fromDate) return false
      }

      if (filters.dateTo) {
        const toDate = new Date(`${filters.dateTo}T23:59:59Z`)
        if (createdAt > toDate) return false
      }

      return true
    })
  }

  return filtered
}

// Проверка, нужно ли использовать mock режим
const shouldUseMock = (): boolean => {
  if (typeof window === 'undefined') return false

  // Проверяем, авторизован ли пользователь - если да, отключаем мок-режим
  const accessToken = localStorage.getItem('access_token')
  if (accessToken) {
    // Если есть токен, но мок-режим включен, отключаем его
    const mockMode = localStorage.getItem('spectro_mock_mode')
    if (mockMode === '1') {
      localStorage.removeItem('spectro_mock_mode')
      console.log('Мок-режим отключен, так как пользователь авторизован')
      return false
    }
    return false
  }

  const searchParams = new URLSearchParams(window.location.search)
  const mockParam = searchParams.get('mock')

  if (mockParam === '1') {
    window.localStorage.setItem('spectro_mock_mode', '1')
    return true
  }

  if (mockParam === '0') {
    window.localStorage.removeItem('spectro_mock_mode')
    return false
  }

  return window.localStorage.getItem('spectro_mock_mode') === '1'
}

// Async thunk для получения пигментов
export const getPigmentsList = createAsyncThunk(
  'filters/getPigmentsList',
  async (_, { getState, rejectWithValue }) => {
    const { filters }: any = getState()

    // Проверяем, нужно ли использовать mock
    const useMock = shouldUseMock()

    if (useMock) {
      // Используем mock данные напрямую
      const mockData = filterPigmentsMock({
        search: filters.search,
        color: filters.color,
        dateFrom: filters.dateRange.from,
        dateTo: filters.dateRange.to,
      })
      return {
        pigments: mockData,
        count: mockData.length,
      }
    }

    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.color) params.append('color', filters.color)
      if (filters.dateRange.from) params.append('date_from', filters.dateRange.from)
      if (filters.dateRange.to) params.append('date_to', filters.dateRange.to)

      // Для веба используем /api/pigments (проксируется через Vite), для Tauri - полный URL
      const apiUrl = IS_TAURI ? `${API_BASE_URL}/api/pigments` : `/api/pigments`
      const response = await fetch(`${apiUrl}?${params}`)

      if (!response.ok) {
        throw new Error('Ошибка при загрузке данных')
      }

      const data = await response.json()
      return data
    } catch (error) {
      // При ошибке возвращаем отфильтрованные mock данные
      const mockData = filterPigmentsMock({
        search: filters.search,
        color: filters.color,
        dateFrom: filters.dateRange.from,
        dateTo: filters.dateRange.to,
      })
      return rejectWithValue({
        pigments: mockData,
        count: mockData.length,
      })
    }
  }
)

const filtersSlice = createSlice({
  name: 'filters',
  initialState: loadInitialState(),
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload
      touch(state)
    },
    setColor(state, action: PayloadAction<string>) {
      state.color = action.payload
      touch(state)
    },
    setDateRange(state, action: PayloadAction<DateRange>) {
      state.dateRange = action.payload
      touch(state)
    },
    setPriceRange(state, action: PayloadAction<PriceRange>) {
      state.priceRange = action.payload
      touch(state)
    },
    resetFilters: () => ({
      ...DEFAULT_STATE,
      lastUpdated: Date.now(),
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPigmentsList.pending, (state) => {
        state.loading = true
      })
      .addCase(getPigmentsList.fulfilled, (state, action) => {
        state.loading = false
        state.pigments = action.payload.pigments || []
      })
      .addCase(getPigmentsList.rejected, (state, action) => {
        state.loading = false
        // При ошибке используем mock данные из rejectWithValue
        if (action.payload) {
          state.pigments = (action.payload as PigmentsResult).pigments || []
        } else {
          state.pigments = []
        }
      })
      // Сброс фильтров при выходе из системы
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.search = ''
        state.color = ''
        state.dateRange = { from: null, to: null }
        state.priceRange = { min: null, max: null }
        state.pigments = []
        state.lastUpdated = Date.now()
      })
  },
})

export const {
  setSearch,
  setColor,
  setDateRange,
  setPriceRange,
  resetFilters,
} = filtersSlice.actions

export default filtersSlice.reducer
export { DEFAULT_STATE as DEFAULT_FILTERS_STATE }
