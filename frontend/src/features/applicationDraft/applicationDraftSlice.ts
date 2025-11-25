import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api'
import { logoutUserAsync } from '../auth/authSlice'
import { API_BASE_URL } from '../../config/target'
import type { PigmentInAnalysis, SpectrumAnalysis } from '../../types/pigment'
import { buildApiUrl } from '../../utils/api'

export interface ApplicationDraftState {
  analysis_id: string | null
  items_count: number
  has_active_cart: boolean
  loading: boolean
  error: string | null
  // Расширенные поля для заявки
  applicationData: {
    name: string
    spectrum: string
    status: 'draft' | 'created' | 'completed' | 'rejected'
    created_at?: string
    formed_at?: string
  } | null
  pigments: PigmentInAnalysis[]
  isDraft: boolean
}

const initialState: ApplicationDraftState = {
  analysis_id: null,
  items_count: 0,
  has_active_cart: false,
  loading: false,
  error: null,
  applicationData: null,
  pigments: [],
  isDraft: false,
}

// Асинхронное действие для получения информации о корзине
export const getCartInfoAsync = createAsyncThunk(
  'applicationDraft/getCartInfoAsync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.api.spectrumAnalysisCartList()
      return response.data
    } catch (error: any) {
      // Если пользователь не авторизован, возвращаем пустую корзину
      if (error?.response?.status === 401) {
        return {
          analysis_id: null,
          items_count: 0,
          has_active_cart: false,
        }
      }
      const errorMessage = error?.response?.data?.message || 'Ошибка при загрузке корзины'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для получения заявки по ID
export const getApplicationAsync = createAsyncThunk(
  'applicationDraft/getApplicationAsync',
  async (id: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(buildApiUrl(`/spectrum-analysis/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Ошибка при загрузке заявки')
      }

      const data = await response.json()
      // Бэкенд возвращает { analysis: {...} }, нужно извлечь данные
      const analysis = data.analysis || data
      // Убеждаемся, что пигменты есть (даже если пустой массив)
      if (!analysis.pigments) {
        analysis.pigments = []
      }
      console.log('getApplicationAsync response:', analysis)
      return analysis
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при загрузке заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для добавления пигмента в заявку
export const addPigmentToApplicationAsync = createAsyncThunk(
  'applicationDraft/addPigmentToApplicationAsync',
  async (pigmentId: number, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(buildApiUrl(`/pigments/${pigmentId}/add-to-sa`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при добавлении пигмента' }))
        throw new Error(errorData.message || 'Ошибка при добавлении пигмента')
      }

      // Обновляем информацию о корзине после добавления
      await dispatch(getCartInfoAsync())

      return { pigmentId }
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при добавлении пигмента'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для удаления заявки
export const deleteApplicationAsync = createAsyncThunk(
  'applicationDraft/deleteApplicationAsync',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(buildApiUrl(`/spectrum-analysis/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при удалении заявки' }))
        throw new Error(errorData.message || 'Ошибка при удалении заявки')
      }

      // Очищаем корзину после удаления
      await dispatch(resetCart())
      await dispatch(getCartInfoAsync())

      return id
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при удалении заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для обновления заявки
export const updateApplicationAsync = createAsyncThunk(
  'applicationDraft/updateApplicationAsync',
  async ({ id, data }: { id: string; data: { name?: string; spectrum?: string } }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(buildApiUrl(`/spectrum-analysis/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при обновлении заявки' }))
        throw new Error(errorData.message || 'Ошибка при обновлении заявки')
      }

      // Обновляем данные заявки
      await dispatch(getApplicationAsync(id))

      return data
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при обновлении заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для формирования заявки
export const formApplicationAsync = createAsyncThunk(
  'applicationDraft/formApplicationAsync',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(buildApiUrl(`/spectrum-analysis/${id}/form`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при формировании заявки' }))
        throw new Error(errorData.message || 'Ошибка при формировании заявки')
      }

      // Обновляем данные заявки
      await dispatch(getApplicationAsync(id))

      return id
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при формировании заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для завершения/отклонения заявки (для модераторов)
export const completeApplicationAsync = createAsyncThunk(
  'applicationDraft/completeApplicationAsync',
  async ({ id, action = 'complete' }: { id: string; action?: 'complete' | 'reject' }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(buildApiUrl(`/spectrum-analysis/${id}/complete`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при завершении заявки' }))
        throw new Error(errorData.message || 'Ошибка при завершении заявки')
      }

      await dispatch(getApplicationAsync(id))
      await dispatch(getCartInfoAsync())

      return { id, action }
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при завершении заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для удаления пигмента из заявки
export const deletePigmentFromApplicationAsync = createAsyncThunk(
  'applicationDraft/deletePigmentFromApplicationAsync',
  async ({ analysisId, pigmentId }: { analysisId: string; pigmentId: number }, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(buildApiUrl(`/spectrumAnalysis-pigments`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spectrum_analysis_id: analysisId,
          pigment_id: pigmentId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при удалении пигмента' }))
        throw new Error(errorData.message || 'Ошибка при удалении пигмента')
      }

      // Обновляем данные заявки
      await dispatch(getApplicationAsync(analysisId))
      await dispatch(getCartInfoAsync())

      return { pigmentId }
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при удалении пигмента'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для обновления пигмента в заявке (комментарий, процент)
export const updatePigmentInApplicationAsync = createAsyncThunk(
  'applicationDraft/updatePigmentInApplicationAsync',
  async (
    { analysisId, pigmentId, comment, percent }: { analysisId: string; pigmentId: number; comment?: string; percent?: number },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const token = localStorage.getItem('access_token')
      const body: any = {
        spectrum_analysis_id: analysisId,
        pigment_id: pigmentId,
      }
      if (comment !== undefined) body.comment = comment
      if (percent !== undefined) body.percent = percent

      const response = await fetch(buildApiUrl(`/spectrumAnalysis-pigments`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Ошибка при обновлении пигмента' }))
        throw new Error(errorData.message || 'Ошибка при обновлении пигмента')
      }

      // Обновляем данные заявки
      await dispatch(getApplicationAsync(analysisId))

      return { pigmentId, comment, percent }
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при обновлении пигмента'
      return rejectWithValue(errorMessage)
    }
  }
)

const applicationDraftSlice = createSlice({
  name: 'applicationDraft',
  initialState,
  reducers: {
    // Действие для обновления количества элементов (после добавления/удаления)
    updateItemsCount: (state, action) => {
      state.items_count = action.payload
    },
    // Действие для сброса корзины
    resetCart: (state) => {
      state.analysis_id = null
      state.items_count = 0
      state.has_active_cart = false
      state.error = null
      state.applicationData = null
      state.pigments = []
      state.isDraft = false
    },
    // Действие для обновления данных заявки
    setApplicationData: (state, action) => {
      if (state.applicationData) {
        state.applicationData = { ...state.applicationData, ...action.payload }
      }
    },
    // Действие для обновления массива пигментов
    setPigments: (state, action) => {
      state.pigments = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Обработка getCartInfoAsync
      .addCase(getCartInfoAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getCartInfoAsync.fulfilled, (state, action) => {
        state.loading = false
        state.analysis_id = action.payload.analysis_id || null
        state.items_count = action.payload.items_count || 0
        state.has_active_cart = action.payload.has_active_cart || false
        state.error = null
      })
      .addCase(getCartInfoAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        // При ошибке сбрасываем корзину
        state.analysis_id = null
        state.items_count = 0
        state.has_active_cart = false
      })
      // Обработка getApplicationAsync
      .addCase(getApplicationAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getApplicationAsync.fulfilled, (state, action) => {
        state.loading = false
        const app = action.payload
        console.log('getApplicationAsync.fulfilled - app:', app)
        console.log('getApplicationAsync.fulfilled - app.pigments:', app.pigments)
        state.analysis_id = app.id || null
        state.isDraft = app.status === 'draft'
        state.applicationData = {
          name: app.name || '',
          spectrum: app.spectrum || '',
          status: app.status || 'draft',
          created_at: app.created_at,
          formed_at: app.formed_at,
        }
        // Обрабатываем пигменты - проверяем разные возможные варианты названия поля
        const pigments = app.pigments || app.Pigments || []
        state.pigments = Array.isArray(pigments) ? pigments : []
        state.items_count = state.pigments.length
        state.error = null
        console.log('getApplicationAsync.fulfilled - final pigments:', state.pigments)
        console.log('getApplicationAsync.fulfilled - items_count:', state.items_count)
      })
      .addCase(getApplicationAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Обработка addPigmentToApplicationAsync
      .addCase(addPigmentToApplicationAsync.pending, (state) => {
        state.error = null
      })
      .addCase(addPigmentToApplicationAsync.fulfilled, (state) => {
        state.error = null
        // Корзина обновится через getCartInfoAsync
      })
      .addCase(addPigmentToApplicationAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка deleteApplicationAsync
      .addCase(deleteApplicationAsync.pending, (state) => {
        state.error = null
      })
      .addCase(deleteApplicationAsync.fulfilled, (state) => {
        // Состояние очистится через resetCart
        state.error = null
      })
      .addCase(deleteApplicationAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка updateApplicationAsync
      .addCase(updateApplicationAsync.pending, (state) => {
        state.error = null
      })
      .addCase(updateApplicationAsync.fulfilled, (state) => {
        state.error = null
        // Данные обновятся через getApplicationAsync
      })
      .addCase(updateApplicationAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка formApplicationAsync
      .addCase(formApplicationAsync.pending, (state) => {
        state.error = null
      })
      .addCase(formApplicationAsync.fulfilled, (state) => {
        state.error = null
        state.isDraft = false
        // Данные обновятся через getApplicationAsync
      })
      .addCase(formApplicationAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка completeApplicationAsync
      .addCase(completeApplicationAsync.pending, (state) => {
        state.error = null
      })
      .addCase(completeApplicationAsync.fulfilled, (state) => {
        state.error = null
      })
      .addCase(completeApplicationAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка deletePigmentFromApplicationAsync
      .addCase(deletePigmentFromApplicationAsync.pending, (state) => {
        state.error = null
      })
      .addCase(deletePigmentFromApplicationAsync.fulfilled, (state) => {
        state.error = null
        // Данные обновятся через getApplicationAsync
      })
      .addCase(deletePigmentFromApplicationAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка updatePigmentInApplicationAsync
      .addCase(updatePigmentInApplicationAsync.pending, (state) => {
        state.error = null
      })
      .addCase(updatePigmentInApplicationAsync.fulfilled, (state) => {
        state.error = null
        // Данные обновятся через getApplicationAsync
      })
      .addCase(updatePigmentInApplicationAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Сброс корзины при выходе из системы
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.analysis_id = null
        state.items_count = 0
        state.has_active_cart = false
        state.error = null
        state.applicationData = null
        state.pigments = []
        state.isDraft = false
      })
  },
})

export const { updateItemsCount, resetCart, setApplicationData, setPigments } = applicationDraftSlice.actions
export default applicationDraftSlice.reducer
