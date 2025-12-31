import { type RootState } from '../../store'

export const selectSpectrumAnalysisDraft = (state: RootState) => state.spectrumAnalysisDraft
export const selectCartAnalysisId = (state: RootState) => state.spectrumAnalysisDraft.analysis_id
export const selectCartItemsCount = (state: RootState) => state.spectrumAnalysisDraft.items_count
export const selectHasActiveCart = (state: RootState) => state.spectrumAnalysisDraft.has_active_cart
export const selectCartLoading = (state: RootState) => state.spectrumAnalysisDraft.loading
export const selectCartError = (state: RootState) => state.spectrumAnalysisDraft.error
