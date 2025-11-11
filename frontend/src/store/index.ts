import { configureStore } from '@reduxjs/toolkit'

import filtersReducer, {
  FILTERS_STORAGE_KEY,
  type FiltersState,
} from '../features/filters/filtersSlice'

const store = configureStore({
  reducer: {
    filters: filtersReducer,
  },
})

const persistFilters = (filters: FiltersState) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // игнорируем ошибки доступа к localStorage (например, приватный режим)
  }
}

if (typeof window !== 'undefined') {
  let previousFilters = store.getState().filters

  store.subscribe(() => {
    const nextFilters = store.getState().filters
    if (previousFilters === nextFilters) {
      return
    }
    previousFilters = nextFilters
    persistFilters(nextFilters)
  })
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
