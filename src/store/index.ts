import { configureStore } from '@reduxjs/toolkit'

import filtersReducer, {
  FILTERS_STORAGE_KEY,
  type FiltersState,
} from '../features/filters/filtersSlice'
import authReducer from '../features/auth/authSlice'
import spectrumAnalysisDraftReducer from '../features/spectrumAnalysisDraft/spectrumAnalysisDraftSlice'
import analysesReducer from '../features/analyses/analysesSlice'

const store = configureStore({
  reducer: {
    filters: filtersReducer,
    auth: authReducer,
    spectrumAnalysisDraft: spectrumAnalysisDraftReducer,
    analyses: analysesReducer,
  },
})

// Убрано сохранение фильтров в localStorage - данные хранятся только в Redux state

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
