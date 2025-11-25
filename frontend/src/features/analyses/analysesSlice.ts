import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { SpectrumAnalysis } from '../../types/pigment'
import { buildApiUrl } from '../../utils/api'

interface AnalysesState {
  items: SpectrumAnalysis[]
  loading: boolean
  error: string | null
}

const initialState: AnalysesState = {
  items: [],
  loading: false,
  error: null,
}

interface FetchParams {
  status?: string
}

export const fetchAnalysesAsync = createAsyncThunk(
  'analyses/fetchAnalysesAsync',
  async (params: FetchParams | undefined, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('access_token')
      const searchParams = new URLSearchParams()
      if (params?.status) {
        searchParams.append('status', params.status)
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
      return data.analyses || []
    } catch (error: any) {
      const errorMessage = error?.message || 'Ошибка при загрузке заявок'
      return rejectWithValue(errorMessage)
    }
  }
)

const analysesSlice = createSlice({
  name: 'analyses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalysesAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnalysesAsync.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload as SpectrumAnalysis[]
        state.error = null
      })
      .addCase(fetchAnalysesAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export default analysesSlice.reducer
