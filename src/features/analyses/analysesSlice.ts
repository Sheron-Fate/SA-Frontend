import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { SpectrumAnalysis } from '../../types/pigment'
import { buildApiUrl } from '../../utils/api'
import { formatDateForApi } from '../../utils/dateFormat'

interface AnalysesFilters {
  status: string | null
  dateFrom: string | null
  dateTo: string | null
}

interface AnalysesState {
  items: SpectrumAnalysis[]
  loading: boolean
  error: string | null
  filters: AnalysesFilters
}

const initialState: AnalysesState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    status: null,
    dateFrom: null,
    dateTo: null,
  },
}

interface FetchParams {
  status?: string
  dateFrom?: string | null
  dateTo?: string | null
}

export const fetchAnalysesAsync = createAsyncThunk(
  'analyses/fetchAnalysesAsync',
  async (params: FetchParams | undefined, { getState, rejectWithValue }) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
      const analysesState = state.analyses

      // Используем параметры из запроса, если они есть, иначе из state
      const status = params?.status ?? analysesState.filters.status
      const dateFrom = params?.dateFrom ?? analysesState.filters.dateFrom
      const dateTo = params?.dateTo ?? analysesState.filters.dateTo

      const searchParams = new URLSearchParams()
      if (status) {
        searchParams.append('status', status)
      }
      // Конвертируем даты из ДД.ММ.ГГГГ в RFC3339 для API
      if (dateFrom) {
        const dateFromApi = formatDateForApi(dateFrom)
        if (dateFromApi) {
          searchParams.append('date_from', dateFromApi)
        }
      }
      if (dateTo) {
        // Для date_to нужно установить время на конец дня (23:59:59)
        const dateToParts = dateTo.split('.')
        if (dateToParts.length === 3) {
          const day = parseInt(dateToParts[0], 10)
          const month = parseInt(dateToParts[1], 10)
          const year = parseInt(dateToParts[2], 10)
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            // Создаем дату в UTC для конца дня
            const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
            searchParams.append('date_to', endOfDay.toISOString())
          }
        }
      }
      const query = searchParams.toString()
      const url = buildApiUrl(`/spectrum-analysis${query ? `?${query}` : ''}`)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при загрузке заявок' }))
        throw new Error(errorData.message || 'Ошибка при загрузке заявок')
      }

      const data = await response.json()
      return {
        analyses: data.analyses || [],
        filters: {
          status: status || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
        },
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при загрузке заявок'
      return rejectWithValue(errorMessage)
    }
  }
)

const analysesSlice = createSlice({
  name: 'analyses',
  initialState,
  reducers: {
    setStatusFilter(state, action: { payload: string | null }) {
      state.filters.status = action.payload
    },
    setDateFromFilter(state, action: { payload: string | null }) {
      state.filters.dateFrom = action.payload
    },
    setDateToFilter(state, action: { payload: string | null }) {
      state.filters.dateTo = action.payload
    },
    resetFilters(state) {
      state.filters = {
        status: null,
        dateFrom: null,
        dateTo: null,
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalysesAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnalysesAsync.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload as { analyses: SpectrumAnalysis[]; filters?: FetchParams }
        state.items = payload.analyses || []
        if (payload.filters) {
          state.filters.status = payload.filters.status || null
          state.filters.dateFrom = payload.filters.dateFrom || null
          state.filters.dateTo = payload.filters.dateTo || null
        }
        state.error = null
      })
      .addCase(fetchAnalysesAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setStatusFilter, setDateFromFilter, setDateToFilter, resetFilters } = analysesSlice.actions

export default analysesSlice.reducer
