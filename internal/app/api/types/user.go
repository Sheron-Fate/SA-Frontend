package types

// RegisterRequest структура для регистрации пользователя
type RegisterRequest struct {
	Login       string `json:"login" binding:"required" example:"researcher"`
	Password    string `json:"password" binding:"required" example:"password123"`
	IsModerator bool   `json:"is_moderator" example:"false"`
}

// LoginRequest структура для входа в систему
type LoginRequest struct {
	Login    string `json:"login" binding:"required" example:"researcher"`
	Password string `json:"password" binding:"required" example:"password123"`
}

// UpdateProfileRequest структура для обновления профиля
type UpdateProfileRequest struct {
	Login    string `json:"login,omitempty" example:"new_login"`
	Password string `json:"password,omitempty" example:"new_password"`
}

// UserProfileResponse структура ответа с профилем пользователя
type UserProfileResponse struct {
	ID          uint   `json:"id" example:"1"`
	Login       string `json:"login" example:"researcher"`
	IsModerator bool   `json:"is_moderator" example:"false"`
	CreatedAt   string `json:"created_at,omitempty" example:"2024-01-01T00:00:00Z"`
}

// AuthResponse структура ответа при аутентификации
type AuthResponse struct {
	AccessToken  string `json:"access_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken string `json:"refresh_token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	User         UserProfileResponse `json:"user"`
	ExpiresIn    int64  `json:"expires_in" example:"86400"`
}

// RefreshTokenRequest структура для обновления токена
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

// LogoutRequest структура для выхода из системы
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}
