import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

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
}

export const FILTERS_STORAGE_KEY = 'spectro_filters_v1'

const DEFAULT_STATE: FiltersState = {
  search: '',
  color: '',
  dateRange: { from: null, to: null },
  priceRange: { min: null, max: null },
  lastUpdated: null,
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
    return {
      ...DEFAULT_STATE,
      ...parsed,
      dateRange: {
        from: parsed?.dateRange?.from ?? DEFAULT_STATE.dateRange.from,
        to: parsed?.dateRange?.to ?? DEFAULT_STATE.dateRange.to,
      },
      priceRange: {
        min: parsed?.priceRange?.min ?? DEFAULT_STATE.priceRange.min,
        max: parsed?.priceRange?.max ?? DEFAULT_STATE.priceRange.max,
      },
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

const touch = (state: FiltersState) => {
  state.lastUpdated = Date.now()
}

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
