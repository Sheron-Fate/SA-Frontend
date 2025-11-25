import type { RootState } from '../../store'

export const selectAnalyses = (state: RootState) => state.analyses.items
export const selectAnalysesLoading = (state: RootState) => state.analyses.loading
export const selectAnalysesError = (state: RootState) => state.analyses.error
