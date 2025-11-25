import { type RootState } from '../../store'

export const selectApplicationDraft = (state: RootState) => state.applicationDraft
export const selectCartAnalysisId = (state: RootState) => state.applicationDraft.analysis_id
export const selectCartItemsCount = (state: RootState) => state.applicationDraft.items_count
export const selectHasActiveCart = (state: RootState) => state.applicationDraft.has_active_cart
export const selectCartLoading = (state: RootState) => state.applicationDraft.loading
export const selectCartError = (state: RootState) => state.applicationDraft.error
