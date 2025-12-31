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

// Убрана загрузка из localStorage - всегда используем DEFAULT_STATE
const loadInitialState = (): FiltersState => {
  return { ...DEFAULT_STATE }
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
// Мок-режим больше не используется, так как localStorage отключен
const shouldUseMock = (): boolean => {
  return false
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
        dateFrom: null,
        dateTo: null,
      })
      return {
        pigments: mockData,
        count: mockData.length,
      }
    }

    try {
      // Используем fetch для совместимости с Tauri (как в getPigmentById)
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.color) params.append('color', filters.color)

      // Формируем URL: для Tauri используем полный URL, для веба - относительный
      // API_BASE_URL для Tauri = "http://172.20.10.3:8080" (без /api)
      // API_BASE_URL для веба = "/"
      // Убираем /api из baseUrl, если он там есть (на случай если где-то уже добавлен)
      let baseUrl = API_BASE_URL === '/' ? '' : API_BASE_URL.replace(/\/api\/?$/, '')
      const url = `${baseUrl}/api/pigments?${params}`

      console.log('[Filters] API_BASE_URL:', API_BASE_URL)
      console.log('[Filters] baseUrl (after cleanup):', baseUrl)
      console.log('[Filters] Loading pigments from URL:', url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('[Filters] Pigments loaded successfully:', data)
      return data
    } catch (error: any) {
      console.error('[Filters] Error loading pigments:', error)
      console.error('[Filters] Error message:', error?.message)

      // При ошибке возвращаем отфильтрованные mock данные
      const mockData = filterPigmentsMock({
        search: filters.search,
        color: filters.color,
        dateFrom: null,
        dateTo: null,
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
