import { type RootState } from '../../store'

export const selectFilters = (state: RootState) => state.filters
export const selectSearch = (state: RootState) => state.filters.search
export const selectColor = (state: RootState) => state.filters.color
export const selectDateRange = (state: RootState) => state.filters.dateRange
export const selectPriceRange = (state: RootState) => state.filters.priceRange
