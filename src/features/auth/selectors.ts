import { type RootState } from '../../store'

export const selectAuth = (state: RootState) => state.auth
export const selectUsername = (state: RootState) => state.auth.username
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectIsModerator = (state: RootState) => state.auth.isModerator
export const selectAuthError = (state: RootState) => state.auth.error
export const selectAccessToken = (state: RootState) => state.auth.accessToken
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken
