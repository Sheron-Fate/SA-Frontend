package types

// Запрос на регистрацию
type RegisterRequest struct {
    Login    string `json:"login" binding:"required"`
    Password string `json:"password" binding:"required"`
}

// Запрос на аутентификацию
type LoginRequest struct {
    Login    string `json:"login" binding:"required"`
    Password string `json:"password" binding:"required"`
}

// Запрос на обновление профиля
type UpdateProfileRequest struct {
    Login    string `json:"login,omitempty"`
    Password string `json:"password,omitempty"`
}

// Ответ с профилем пользователя
type UserProfileResponse struct {
    ID          uint   `json:"id"`
    Login       string `json:"login"`
    IsModerator bool   `json:"is_moderator"`
    CreatedAt   string `json:"created_at,omitempty"`
}