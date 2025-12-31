import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api'
import { logoutUserAsync } from '../auth/authSlice'
import { API_BASE_URL } from '../../config/target'
import type { PigmentInAnalysis, SpectrumAnalysis } from '../../types/pigment'
import { buildApiUrl } from '../../utils/api'

export interface SpectrumAnalysisDraftState {
  analysis_id: string | null
  items_count: number
  has_active_cart: boolean
  loading: boolean
  error: string | null
  // Расширенные поля для заявки
  spectrumAnalysisData: {
    name: string
    spectrum: string
    status: 'draft' | 'created' | 'completed' | 'rejected'
    created_at?: string
    formed_at?: string
  } | null
  pigments: PigmentInAnalysis[]
  isDraft: boolean
}

const initialState: SpectrumAnalysisDraftState = {
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
  'spectrumAnalysisDraft/getCartInfoAsync',
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
export const getSpectrumAnalysisAsync = createAsyncThunk(
  'spectrumAnalysisDraft/getSpectrumAnalysisAsync',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
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
      console.log('getSpectrumAnalysisAsync response:', analysis)
      return analysis
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при загрузке заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для добавления пигмента в заявку
export const addPigmentToSpectrumAnalysisAsync = createAsyncThunk(
  'spectrumAnalysisDraft/addPigmentToSpectrumAnalysisAsync',
  async (pigmentId: number, { getState, rejectWithValue, dispatch }) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
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
export const deleteSpectrumAnalysisAsync = createAsyncThunk(
  'spectrumAnalysisDraft/deleteSpectrumAnalysisAsync',
  async (id: string, { getState, rejectWithValue, dispatch }) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
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
export const updateSpectrumAnalysisAsync = createAsyncThunk(
  'spectrumAnalysisDraft/updateSpectrumAnalysisAsync',
  async ({ id, data }: { id: string; data: { name?: string; spectrum?: string } }, { getState, rejectWithValue, dispatch }) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
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
      await dispatch(getSpectrumAnalysisAsync(id))

      return data
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при обновлении заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для формирования заявки
export const formSpectrumAnalysisAsync = createAsyncThunk(
  'spectrumAnalysisDraft/formSpectrumAnalysisAsync',
  async (id: string, { getState, rejectWithValue, dispatch }) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
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
      await dispatch(getSpectrumAnalysisAsync(id))

      return id
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при формировании заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для завершения/отклонения заявки (для модераторов)
export const completeSpectrumAnalysisAsync = createAsyncThunk(
  'spectrumAnalysisDraft/completeSpectrumAnalysisAsync',
  async ({ id, action = 'complete' }: { id: string; action?: 'complete' | 'reject' }, { getState, rejectWithValue, dispatch }) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
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

      // Не обновляем заявку и корзину после завершения - это делается в списке заявок
      return { id, action }
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при завершении заявки'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для удаления пигмента из заявки
export const deletePigmentFromSpectrumAnalysisAsync = createAsyncThunk(
  'spectrumAnalysisDraft/deletePigmentFromSpectrumAnalysisAsync',
  async ({ analysisId, pigmentId }: { analysisId: string; pigmentId: number }, { getState, rejectWithValue, dispatch }) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
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
      await dispatch(getSpectrumAnalysisAsync(analysisId))
      await dispatch(getCartInfoAsync())

      return { pigmentId }
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при удалении пигмента'
      return rejectWithValue(errorMessage)
    }
  }
)

// Асинхронное действие для обновления пигмента в заявке (комментарий, процент)
export const updatePigmentInSpectrumAnalysisAsync = createAsyncThunk(
  'spectrumAnalysisDraft/updatePigmentInSpectrumAnalysisAsync',
  async (
    { analysisId, pigmentId, comment, percent }: { analysisId: string; pigmentId: number; comment?: string; percent?: number },
    { getState, rejectWithValue, dispatch }
  ) => {
    try {
      const state: any = getState()
      const token = state.auth.accessToken
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
      await dispatch(getSpectrumAnalysisAsync(analysisId))

      return { pigmentId, comment, percent }
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при обновлении пигмента'
      return rejectWithValue(errorMessage)
    }
  }
)

const spectrumAnalysisDraftSlice = createSlice({
  name: 'spectrumAnalysisDraft',
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
    setSpectrumAnalysisData: (state, action) => {
      if (state.spectrumAnalysisData) {
        state.spectrumAnalysisData = { ...state.spectrumAnalysisData, ...action.payload }
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
      // Обработка getSpectrumAnalysisAsync
      .addCase(getSpectrumAnalysisAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getSpectrumAnalysisAsync.fulfilled, (state, action) => {
        state.loading = false
        const analysis = action.payload
        console.log('getSpectrumAnalysisAsync.fulfilled - analysis:', analysis)
        console.log('getSpectrumAnalysisAsync.fulfilled - analysis.pigments:', analysis.pigments)
        state.analysis_id = analysis.id || null
        state.isDraft = analysis.status === 'draft'
        state.spectrumAnalysisData = {
          name: app.name || '',
          spectrum: app.spectrum || '',
          status: app.status || 'draft',
          created_at: app.created_at,
          formed_at: analysis.formed_at,
        }
        // Обрабатываем пигменты - проверяем разные возможные варианты названия поля
        const pigments = analysis.pigments || analysis.Pigments || []
        state.pigments = Array.isArray(pigments) ? pigments : []
        state.items_count = state.pigments.length
        state.error = null
        console.log('getSpectrumAnalysisAsync.fulfilled - final pigments:', state.pigments)
        console.log('getSpectrumAnalysisAsync.fulfilled - items_count:', state.items_count)
      })
      .addCase(getSpectrumAnalysisAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Обработка addPigmentToSpectrumAnalysisAsync
      .addCase(addPigmentToSpectrumAnalysisAsync.pending, (state) => {
        state.error = null
      })
      .addCase(addPigmentToSpectrumAnalysisAsync.fulfilled, (state) => {
        state.error = null
        // Корзина обновится через getCartInfoAsync
      })
      .addCase(addPigmentToSpectrumAnalysisAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка deleteSpectrumAnalysisAsync
      .addCase(deleteSpectrumAnalysisAsync.pending, (state) => {
        state.error = null
      })
      .addCase(deleteSpectrumAnalysisAsync.fulfilled, (state) => {
        // Состояние очистится через resetCart
        state.error = null
      })
      .addCase(deleteSpectrumAnalysisAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка updateSpectrumAnalysisAsync
      .addCase(updateSpectrumAnalysisAsync.pending, (state) => {
        state.error = null
      })
      .addCase(updateSpectrumAnalysisAsync.fulfilled, (state) => {
        state.error = null
        // Данные обновятся через getSpectrumAnalysisAsync
      })
      .addCase(updateSpectrumAnalysisAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка formSpectrumAnalysisAsync
      .addCase(formSpectrumAnalysisAsync.pending, (state) => {
        state.error = null
      })
      .addCase(formSpectrumAnalysisAsync.fulfilled, (state) => {
        state.error = null
        state.isDraft = false
        // Данные обновятся через getSpectrumAnalysisAsync
      })
      .addCase(formSpectrumAnalysisAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка completeSpectrumAnalysisAsync
      .addCase(completeSpectrumAnalysisAsync.pending, (state) => {
        state.error = null
      })
      .addCase(completeSpectrumAnalysisAsync.fulfilled, (state) => {
        state.error = null
      })
      .addCase(completeSpectrumAnalysisAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка deletePigmentFromSpectrumAnalysisAsync
      .addCase(deletePigmentFromSpectrumAnalysisAsync.pending, (state) => {
        state.error = null
      })
      .addCase(deletePigmentFromSpectrumAnalysisAsync.fulfilled, (state) => {
        state.error = null
        // Данные обновятся через getSpectrumAnalysisAsync
      })
      .addCase(deletePigmentFromSpectrumAnalysisAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Обработка updatePigmentInSpectrumAnalysisAsync
      .addCase(updatePigmentInSpectrumAnalysisAsync.pending, (state) => {
        state.error = null
      })
      .addCase(updatePigmentInSpectrumAnalysisAsync.fulfilled, (state) => {
        state.error = null
        // Данные обновятся через getSpectrumAnalysisAsync
      })
      .addCase(updatePigmentInSpectrumAnalysisAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Сброс корзины при выходе из системы
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.analysis_id = null
        state.items_count = 0
        state.has_active_cart = false
        state.error = null
        state.spectrumAnalysisData = null
        state.pigments = []
        state.isDraft = false
      })
  },
})

export const { updateItemsCount, resetCart, setSpectrumAnalysisData, setPigments } = spectrumAnalysisDraftSlice.actions
export default spectrumAnalysisDraftSlice.reducer
